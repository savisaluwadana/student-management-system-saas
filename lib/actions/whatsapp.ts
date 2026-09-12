'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'text' | 'template';
  templateName?: string;
  templateParams?: Record<string, string>;
}

export interface WhatsAppBulkMessage {
  recipients: string[];
  message: string;
  type: 'class' | 'all' | 'custom';
  classId?: string;
}

function getWhatsAppProvider() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!accountSid || !authToken || !from) return null;

  return {
    client: require('twilio')(accountSid, authToken),
    from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
  };
}

function normalizeE164(phone: string): string | null {
  const value = phone.trim();
  if (!value) return null;

  const cleaned = value.replace(/\D/g, '');
  if (!cleaned) return null;

  let formatted: string;
  if (value.startsWith('+')) formatted = `+${cleaned}`;
  else if (cleaned.startsWith('94')) formatted = `+${cleaned}`;
  else if (cleaned.startsWith('0')) formatted = `+94${cleaned.slice(1)}`;
  else formatted = `+${cleaned}`;

  return /^\+[1-9]\d{1,14}$/.test(formatted) ? formatted : null;
}

async function deliverWhatsAppMessage(messageData: WhatsAppMessage) {
  const to = normalizeE164(messageData.to);
  if (!to) {
    return { success: false as const, error: 'Invalid phone number format. Use E.164 format (e.g., +94771234567).' };
  }

  const provider = getWhatsAppProvider();
  if (!provider) {
    return {
      success: false as const,
      error: 'WhatsApp delivery is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_WHATSAPP_FROM.',
    };
  }

  if (!messageData.message?.trim()) {
    return { success: false as const, error: 'Message cannot be empty.' };
  }

  try {
    const response = await provider.client.messages.create({
      body: messageData.message.trim(),
      from: provider.from,
      to: `whatsapp:${to}`,
    });

    return { success: true as const, messageId: response.sid as string };
  } catch (error: any) {
    console.error('WhatsApp delivery failed:', error);
    return { success: false as const, error: error?.message || 'WhatsApp delivery failed.' };
  }
}

export async function sendWhatsAppMessage(
  messageData: WhatsAppMessage
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  await requireWorkspaceContext();
  return deliverWhatsAppMessage(messageData);
}

export async function sendBulkWhatsAppMessages(
  bulkData: WhatsAppBulkMessage
): Promise<{ success: boolean; error?: string; sent: number; failed: number }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  if (!bulkData.message?.trim()) {
    return { success: false, error: 'Message cannot be empty.', sent: 0, failed: 0 };
  }

  let recipients: string[] = [];

  if (bulkData.type === 'class') {
    if (!bulkData.classId) {
      return { success: false, error: 'Class is required.', sent: 0, failed: 0 };
    }

    const enrollments = await Enrollment.find(
      workspaceFilter(context, { class_id: bulkData.classId, status: 'active' })
    )
      .populate('student_id', 'phone guardian_phone whatsapp_phone')
      .lean({ virtuals: true });

    recipients = (enrollments as any[])
      .map((enrollment) =>
        enrollment.student_id?.whatsapp_phone ||
        enrollment.student_id?.guardian_phone ||
        enrollment.student_id?.phone
      )
      .filter(Boolean);
  } else if (bulkData.type === 'all') {
    const students = await Student.find(workspaceFilter(context, { status: 'active' }))
      .select('phone guardian_phone whatsapp_phone')
      .lean();

    recipients = (students as any[])
      .map((student) => student.whatsapp_phone || student.guardian_phone || student.phone)
      .filter(Boolean);
  } else if (bulkData.type === 'custom') {
    recipients = bulkData.recipients || [];
  }

  const normalizedRecipients = Array.from(
    new Set(recipients.map((recipient) => normalizeE164(recipient)).filter((recipient): recipient is string => Boolean(recipient)))
  );

  if (normalizedRecipients.length === 0) {
    return { success: false, error: 'No valid recipients found.', sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (const recipient of normalizedRecipients) {
    const result = await deliverWhatsAppMessage({
      to: recipient,
      message: bulkData.message,
      type: 'text',
    });

    if (result.success) sent += 1;
    else {
      failed += 1;
      firstError ||= result.error;
    }
  }

  revalidatePath('/communications');
  return {
    success: failed === 0,
    error: failed > 0 ? firstError || `${failed} message(s) failed to send.` : undefined,
    sent,
    failed,
  };
}

export async function getWhatsAppTemplates() {
  return [
    { name: 'payment_reminder', displayName: 'Payment Reminder', message: 'Hi {{student_name}}, payment of LKR {{amount}} due on {{due_date}}.', params: ['student_name', 'amount', 'due_date'] },
    { name: 'attendance_alert', displayName: 'Attendance Alert', message: 'Dear Parent, {{student_name}} was absent in {{class_name}} on {{date}}.', params: ['student_name', 'class_name', 'date'] },
    { name: 'class_announcement', displayName: 'Class Announcement', message: 'Announcement for {{class_name}}: {{message}}', params: ['class_name', 'message'] },
    { name: 'assessment_result', displayName: 'Assessment Result', message: '{{student_name}}, your result for {{assessment_name}}: {{score}}/{{max_score}}.', params: ['student_name', 'assessment_name', 'score', 'max_score'] },
  ];
}

export async function getWhatsAppHistory(limit = 50) {
  await requireWorkspaceContext();
  return [];
}

export async function formatPhoneNumber(phone: string, countryCode = '+94'): Promise<string> {
  const cleaned = phone.replace(/\D/g, '');
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  if (withoutLeadingZero.startsWith(countryCode.replace('+', ''))) return '+' + withoutLeadingZero;
  return countryCode + withoutLeadingZero;
}
