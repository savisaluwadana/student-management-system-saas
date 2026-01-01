import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        // Verify CRON_SECRET
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Get reminders config from request or use defaults
        const { daysBeforeDue = 3 } = await request.json().catch(() => ({}));

        // Calculate the target due date (X days from now)
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBeforeDue);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Get unpaid payments due in X days with student and guardian info
        const { data: upcomingPayments, error: fetchError } = await supabase
            .from('fee_payments')
            .select(`
        id,
        amount,
        due_date,
        payment_month,
        student_id,
        students!inner(
          id,
          full_name,
          email,
          phone,
          guardian_name,
          guardian_email,
          guardian_phone
        )
      `)
            .eq('status', 'unpaid')
            .eq('due_date', targetDateStr);

        if (fetchError) {
            console.error('Error fetching upcoming payments:', fetchError);
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        if (!upcomingPayments || upcomingPayments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No reminders to send',
                emailsSent: 0,
                smsSent: 0,
            });
        }

        let emailsSent = 0;
        let smsSent = 0;
        const errors: string[] = [];

        // Send reminders for each payment
        for (const payment of upcomingPayments) {
            const student = (payment as any).students;
            const dueDate = new Date(payment.due_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const amount = Number(payment.amount).toFixed(2);

            // Determine email recipient (prefer guardian email, fall back to student)
            const emailTo = student.guardian_email || student.email;
            const recipientName = student.guardian_name || student.full_name;

            // Send email reminder
            if (emailTo && process.env.RESEND_API_KEY) {
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

            // Send SMS reminder (if Twilio is configured)
            const phoneNumber = student.guardian_phone || student.phone;
            if (phoneNumber && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                try {
                    const twilio = require('twilio')(
                        process.env.TWILIO_ACCOUNT_SID,
                        process.env.TWILIO_AUTH_TOKEN
                    );

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

            // Log the communication
            await supabase.from('communications').insert({
                recipient_type: 'student',
                recipient_id: student.id,
                channel: emailTo && phoneNumber ? 'both' : (emailTo ? 'email' : 'sms'),
                subject: `Payment Reminder - Due ${dueDate}`,
                message: `Payment reminder for $${amount} due on ${dueDate}`,
                status: 'sent',
                sent_at: new Date().toISOString(),
                metadata: { payment_id: payment.id, daysBeforeDue },
            });
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
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
