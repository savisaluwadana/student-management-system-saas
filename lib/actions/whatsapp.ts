'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import { getCurrentUser } from '@/lib/auth/auth';

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

export async function sendWhatsAppMessage(
  messageData: WhatsAppMessage
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  if (!phoneRegex.test(messageData.to)) {
    return { success: false, error: 'Invalid phone number format. Use E.164 format (e.g., +94771234567)' };
  }

  const mockApiResponse = await simulateWhatsAppAPI(messageData);
  if (!mockApiResponse.success) return { success: false, error: mockApiResponse.error };

  return { success: true, messageId: mockApiResponse.messageId };
}

export async function sendBulkWhatsAppMessages(
  bulkData: WhatsAppBulkMessage
): Promise<{ success: boolean; error?: string; sent: number; failed: number }> {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized', sent: 0, failed: 0 };

  let recipients: string[] = [];

  if (bulkData.type === 'class' && bulkData.classId) {
    const enrollments = await Enrollment.find({ class_id: bulkData.classId, status: 'active' })
      .populate('student_id', 'phone guardian_phone')
      .lean({ virtuals: true });
    recipients = (enrollments as any[])
      .map((e) => e.student_id?.phone || e.student_id?.guardian_phone)
      .filter(Boolean);
  } else if (bulkData.type === 'all') {
    const students = await Student.find({ status: 'active' }).select('phone guardian_phone').lean();
    recipients = (students as any[]).map((s) => s.phone || s.guardian_phone).filter(Boolean);
  } else if (bulkData.type === 'custom') {
    recipients = bulkData.recipients;
  }

  if (recipients.length === 0) return { success: false, error: 'No valid recipients found', sent: 0, failed: 0 };

  let sent = 0, failed = 0;
  for (const recipient of recipients) {
    const result = await sendWhatsAppMessage({ to: recipient, message: bulkData.message, type: 'text' });
    if (result.success) sent++; else failed++;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  revalidatePath('/communications');
  return { success: true, sent, failed };
}

export async function getWhatsAppTemplates() {
  return [
    { name: 'payment_reminder', displayName: 'Payment Reminder', message: 'Hi {{student_name}}, payment of LKR {{amount}} due on {{due_date}}.', params: ['student_name', 'amount', 'due_date'] },
    { name: 'attendance_alert', displayName: 'Attendance Alert', message: 'Dear Parent, {{student_name}} was absent in {{class_name}} on {{date}}.', params: ['student_name', 'class_name', 'date'] },
    { name: 'class_announcement', displayName: 'Class Announcement', message: 'Announcement for {{class_name}}: {{message}}', params: ['class_name', 'message'] },
    { name: 'assessment_result', displayName: 'Assessment Result', message: '{{student_name}}, your result for {{assessment_name}}: {{score}}/{{max_score}}.', params: ['student_name', 'assessment_name', 'score', 'max_score'] },
  ];
}

async function simulateWhatsAppAPI(messageData: WhatsAppMessage): Promise<{ success: boolean; error?: string; messageId?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const isSuccess = Math.random() > 0.1;
  if (isSuccess) return { success: true, messageId: `wamid.${Date.now()}.${Math.random().toString(36).substr(2, 9)}` };
  return { success: false, error: 'Message delivery failed (simulated)' };
}

export async function getWhatsAppHistory(limit = 50) {
  // Communication logs are stored in the Communication collection
  return [];
}

export async function formatPhoneNumber(phone: string, countryCode = '+94'): Promise<string> {
  const cleaned = phone.replace(/\D/g, '');
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  if (withoutLeadingZero.startsWith(countryCode.replace('+', ''))) return '+' + withoutLeadingZero;
  return countryCode + withoutLeadingZero;
}
