'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import NotificationPreference from '@/lib/mongodb/models/NotificationPreference';
import NotificationLog from '@/lib/mongodb/models/NotificationLog';
import User from '@/lib/mongodb/models/User';
import { getCurrentUser } from '@/lib/auth/auth';
import { sendEmail } from '@/lib/services/notifications/email';
import { sendSms } from '@/lib/services/notifications/sms';
import { sendWhatsApp } from '@/lib/services/notifications/whatsapp';

export interface NotificationPreferenceType {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  notify_payments: boolean;
  notify_attendance: boolean;
  notify_assessments: boolean;
  notify_enrollments: boolean;
  notify_announcements: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferenceInput {
  email_notifications?: boolean;
  sms_notifications?: boolean;
  whatsapp_notifications?: boolean;
  notify_payments?: boolean;
  notify_attendance?: boolean;
  notify_assessments?: boolean;
  notify_enrollments?: boolean;
  notify_announcements?: boolean;
}

export async function getNotificationPreferences(): Promise<NotificationPreferenceType | null> {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) return null;

  let prefs = await NotificationPreference.findOne({ user_id: user.id }).lean({ virtuals: true });

  if (!prefs) {
    const newPrefs = await NotificationPreference.create({ user_id: user.id });
    return { ...(newPrefs.toObject({ virtuals: true })), id: newPrefs._id.toHexString() } as unknown as NotificationPreferenceType;
  }

  const p = prefs as any;
  return { ...p, id: p._id.toString() } as unknown as NotificationPreferenceType;
}

export async function updateNotificationPreferences(
  input: UpdateNotificationPreferenceInput
): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await NotificationPreference.findOneAndUpdate(
      { user_id: user.id },
      { ...input, updated_at: new Date() },
      { upsert: true }
    );
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendNotification(
  userId: string,
  type: 'payment' | 'attendance' | 'assessment' | 'enrollment' | 'announcement',
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  const prefs = await NotificationPreference.findOne({ user_id: userId }).lean();
  if (!prefs) return { success: false, error: 'No notification preferences found' };

  const p = prefs as any;
  const typeKey = `notify_${type}s` as keyof typeof p;
  if (!p[typeKey]) return { success: true };

  const userData = await User.findById(userId).select('email phone').lean();
  if (!userData) return { success: false, error: 'User not found' };

  const u = userData as any;
  const notifications: string[] = [];

  if (p.email_notifications && u.email) {
    const res = await sendEmail({ to: u.email, subject, message });
    if (res.success) notifications.push('email');
  }

  if (p.sms_notifications && u.phone) {
    const res = await sendSms({ to: u.phone, message });
    if (res.success) notifications.push('sms');
  }

  if (p.whatsapp_notifications && u.phone) {
    const res = await sendWhatsApp({ to: u.phone, message });
    if (res.success) notifications.push('whatsapp');
  }

  if (notifications.length === 0) return { success: true };

  await NotificationLog.create({ user_id: userId, type, subject, message, channels: notifications, status: 'sent' });
  return { success: true };
}

export async function getNotificationLogs(limit = 50) {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) return [];

  const logs = await NotificationLog.find({ user_id: user.id })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean({ virtuals: true });

  return (logs as any[]).map((l) => ({ ...l, id: l._id.toString() }));
}
