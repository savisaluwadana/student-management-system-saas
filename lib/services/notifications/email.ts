import { Resend } from 'resend';

export async function sendEmail({
  to,
  subject,
  message,
}: {
  to: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { success: false, error: 'Email provider is not configured.' };
  }

  if (!to?.trim() || !subject?.trim() || !message?.trim()) {
    return { success: false, error: 'Email recipient, subject, and message are required.' };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: to.trim(),
      subject: subject.trim(),
      text: message.trim(),
    });

    if (result.error) {
      return { success: false, error: result.error.message || 'Email provider rejected the message.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email delivery failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email delivery failed.',
    };
  }
}
