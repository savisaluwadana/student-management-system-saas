import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { validateCronAuthorization } from '@/lib/saas/cron';
import { getPaymentReminderCandidates } from '@/lib/saas/jobs';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return null;
  if (phone.trim().startsWith('+')) return `+${cleaned}`;
  if (cleaned.startsWith('94')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+94${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export async function POST(request: Request) {
  try {
    const authorization = validateCronAuthorization(request);
    if (!authorization.ok) {
      return NextResponse.json(
        { error: authorization.error },
        { status: authorization.status }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedDays = body?.daysBeforeDue === undefined ? 3 : Number(body.daysBeforeDue);
    if (!Number.isInteger(requestedDays) || requestedDays < 0 || requestedDays > 30) {
      return NextResponse.json(
        { error: 'daysBeforeDue must be an integer between 0 and 30.' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim();
    const resendFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
    const emailEnabled = Boolean(resendApiKey && resendFromEmail);
    const resend = emailEnabled ? new Resend(resendApiKey) : null;

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
    const smsEnabled = Boolean(twilioAccountSid && twilioAuthToken && twilioPhoneNumber);
    const twilioClient = smsEnabled
      ? require('twilio')(twilioAccountSid, twilioAuthToken)
      : null;

    if (!emailEnabled && !smsEnabled) {
      return NextResponse.json(
        { error: 'No reminder provider is configured. Configure Resend and/or Twilio.' },
        { status: 503 }
      );
    }

    const reminderBatch = await getPaymentReminderCandidates(requestedDays);
    const upcomingPayments = reminderBatch.payments as any[];

    if (upcomingPayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        targetDate: reminderBatch.targetDate,
        paymentsProcessed: 0,
        emailsSent: 0,
        smsSent: 0,
      });
    }

    let emailsSent = 0;
    let smsSent = 0;
    let skippedNoContact = 0;
    const errors: string[] = [];

    for (const payment of upcomingPayments) {
      const student = payment.student_id;
      if (!student) continue;

      const workspace = payment.workspace_id;
      const workspaceName = workspace?.name || 'Academix';
      const currency = workspace?.currency || 'LKR';
      const timezone = workspace?.timezone || 'Asia/Colombo';
      const amount = formatMoney(Number(payment.amount || 0), currency);
      const dueDate = new Date(`${payment.due_date}T00:00:00`).toLocaleDateString('en-LK', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone,
      });

      const emailTo = student.guardian_email || student.email;
      const phoneNumber = normalizePhoneNumber(student.guardian_phone || student.phone);
      const recipientName = student.guardian_name || student.full_name || 'Parent / Guardian';

      if (!emailTo && !phoneNumber) {
        skippedNoContact += 1;
        continue;
      }

      if (emailEnabled && resend && emailTo) {
        try {
          const safeRecipientName = escapeHtml(String(recipientName));
          const safeStudentName = escapeHtml(String(student.full_name || 'Student'));
          const safeWorkspaceName = escapeHtml(workspaceName);
          const safeAmount = escapeHtml(amount);
          const safeDueDate = escapeHtml(dueDate);

          await resend.emails.send({
            from: resendFromEmail!,
            to: emailTo,
            subject: `${workspaceName} payment reminder - due ${dueDate}`,
            html: `
              <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;color:#18181b;line-height:1.6">
                <div style="border-bottom:1px solid #e4e4e7;padding:20px 0;margin-bottom:24px">
                  <strong style="font-size:18px">${safeWorkspaceName}</strong>
                </div>
                <p>Dear ${safeRecipientName},</p>
                <p>This is a reminder about an upcoming student payment.</p>
                <div style="background:#f4f4f5;padding:20px;border-radius:12px;margin:20px 0">
                  <p style="margin:0 0 8px"><strong>Student:</strong> ${safeStudentName}</p>
                  <p style="margin:0 0 8px"><strong>Amount due:</strong> ${safeAmount}</p>
                  <p style="margin:0"><strong>Due date:</strong> ${safeDueDate}</p>
                </div>
                <p>Please disregard this message if the payment has already been settled.</p>
                <p>Thank you,<br>${safeWorkspaceName}</p>
              </div>
            `,
          });
          emailsSent += 1;
        } catch (emailError: any) {
          errors.push(`Email reminder failed for payment ${payment._id}: ${emailError?.message || 'Unknown error'}`);
        }
      }

      if (smsEnabled && twilioClient && phoneNumber) {
        try {
          await twilioClient.messages.create({
            body: `${workspaceName}: ${amount} is due on ${dueDate} for ${student.full_name}. Please disregard if already paid.`,
            from: twilioPhoneNumber,
            to: phoneNumber,
          });
          smsSent += 1;
        } catch (smsError: any) {
          errors.push(`SMS reminder failed for payment ${payment._id}: ${smsError?.message || 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${emailsSent} emails and ${smsSent} SMS reminders`,
      targetDate: reminderBatch.targetDate,
      paymentsProcessed: upcomingPayments.length,
      emailsSent,
      smsSent,
      skippedNoContact,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-reminders cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
