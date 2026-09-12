function normalizePhoneNumber(phone: string): string | null {
  const value = phone.trim();
  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) return null;

  let formatted: string;
  if (value.startsWith('+')) formatted = `+${cleaned}`;
  else if (cleaned.startsWith('94')) formatted = `+${cleaned}`;
  else if (cleaned.startsWith('0')) formatted = `+94${cleaned.slice(1)}`;
  else formatted = `+${cleaned}`;

  return /^\+[1-9]\d{1,14}$/.test(formatted) ? formatted : null;
}

export async function sendWhatsApp({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const configuredFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken || !configuredFrom) {
    return { success: false, error: 'WhatsApp provider is not configured.' };
  }

  const recipient = normalizePhoneNumber(to || '');
  if (!recipient) return { success: false, error: 'Invalid WhatsApp recipient phone number.' };
  if (!message?.trim()) return { success: false, error: 'WhatsApp message cannot be empty.' };

  try {
    const twilio = require('twilio')(accountSid, authToken);
    const from = configuredFrom.startsWith('whatsapp:')
      ? configuredFrom
      : `whatsapp:${configuredFrom}`;

    await twilio.messages.create({
      body: message.trim(),
      from,
      to: `whatsapp:${recipient}`,
    });
    return { success: true };
  } catch (error) {
    console.error('WhatsApp notification delivery failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'WhatsApp delivery failed.',
    };
  }
}
