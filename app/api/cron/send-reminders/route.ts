import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import Student from '@/lib/mongodb/models/Student';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set');
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }
    const resend = new Resend(resendApiKey);

    await connectDB();

    // Get reminders config from request or use defaults
    const { daysBeforeDue = 3 } = await request.json().catch(() => ({}));

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysBeforeDue);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    // Get unpaid payments due in X days
    const upcomingPayments = await FeePayment.find({
      status: { $in: ['pending', 'unpaid'] },
      due_date: targetDateStr,
    })
      .populate('student_id', 'full_name email phone guardian_name guardian_email guardian_phone')
      .lean({ virtuals: true });

    if (!upcomingPayments.length) {
      return NextResponse.json({ success: true, message: 'No reminders to send', emailsSent: 0, smsSent: 0 });
    }

    let emailsSent = 0;
    let smsSent = 0;
    const errors: string[] = [];

    for (const payment of upcomingPayments as any[]) {
      const student = payment.student_id;
      if (!student) continue;

      const dueDate = new Date(payment.due_date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const amount = Number(payment.amount).toFixed(2);

      const emailTo = student.guardian_email || student.email;
      const recipientName = student.guardian_name || student.full_name;

      if (emailTo && resendApiKey) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@example.com',
            to: emailTo,
            subject: `Payment Reminder - Due ${dueDate}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Payment Reminder</h2>
                <p>Dear ${recipientName},</p>
                <p>This is a friendly reminder that a payment is due soon:</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Student:</strong> ${student.full_name}</p>
                  <p><strong>Amount Due:</strong> $${amount}</p>
                  <p><strong>Due Date:</strong> ${dueDate}</p>
                </div>
                <p>Please ensure payment is made by the due date to avoid any late fees.</p>
                <p>Thank you,<br>Student Management System</p>
              </div>
            `,
          });
          emailsSent++;
        } catch (emailError: any) {
          errors.push(`Email to ${emailTo}: ${emailError.message}`);
        }
      }

      const phoneNumber = student.guardian_phone || student.phone;
      if (phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
          const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await twilio.messages.create({
            body: `Payment Reminder: $${amount} is due on ${dueDate} for ${student.full_name}. Please make payment before the due date.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
          });
          smsSent++;
        } catch (smsError: any) {
          errors.push(`SMS to ${phoneNumber}: ${smsError.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${emailsSent} emails and ${smsSent} SMS reminders`,
      emailsSent,
      smsSent,
      paymentsProcessed: upcomingPayments.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in send-reminders cron:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
