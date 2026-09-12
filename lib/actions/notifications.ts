'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import NotificationPreference from '@/lib/mongodb/models/NotificationPreference';
import NotificationLog from '@/lib/mongodb/models/NotificationLog';
import User from '@/lib/mongodb/models/User';
import { sendEmail } from '@/lib/services/notifications/email';
import { sendSms } from '@/lib/services/notifications/sms';
import { sendWhatsApp } from '@/lib/services/notifications/whatsapp';
import { requireWorkspaceContext, workspaceFilter, workspaceValue } from '@/lib/saas/workspace';

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
  const context = await requireWorkspaceContext();

  let preferences = await NotificationPreference.findOne(
    workspaceFilter(context, { user_id: context.user.id })
  ).lean({ virtuals: true });

  if (!preferences) {
    const newPreferences = await NotificationPreference.create({
      workspace_id: workspaceValue(context),
      user_id: context.user.id,
    });
    return {
      ...(newPreferences.toObject({ virtuals: true })),
      id: newPreferences._id.toHexString(),
    } as unknown as NotificationPreferenceType;
  }

  const data = preferences as any;
  return { ...data, id: data._id.toString() } as unknown as NotificationPreferenceType;
}

export async function updateNotificationPreferences(
  input: UpdateNotificationPreferenceInput
): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  try {
    await NotificationPreference.findOneAndUpdate(
      workspaceFilter(context, { user_id: context.user.id }),
      {
        ...input,
        workspace_id: workspaceValue(context),
        updated_at: new Date(),
      },
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
  const context = await requireWorkspaceContext();

  const userData = await User.findOne(workspaceFilter(context, { _id: userId })).select('email phone').lean();
  if (!userData) return { success: false, error: 'User not found in this workspace' };

  let preferences = await NotificationPreference.findOne(
    workspaceFilter(context, { user_id: userId })
  ).lean();

  if (!preferences) {
    preferences = await NotificationPreference.create({
      workspace_id: workspaceValue(context),
      user_id: userId,
    }).then((document) => document.toObject());
  }

  const prefs = preferences as any;
  const typeKey = `notify_${type}s` as keyof typeof prefs;
  if (!prefs[typeKey]) return { success: true };

  const user = userData as any;
  const channels: string[] = [];
  let attempted = false;

  if (prefs.email_notifications && user.email) {
    attempted = true;
    const result = await sendEmail({ to: user.email, subject, message });
    if (result.success) channels.push('email');
  }

  if (prefs.sms_notifications && user.phone) {
    attempted = true;
    const result = await sendSms({ to: user.phone, message });
    if (result.success) channels.push('sms');
  }

  if (prefs.whatsapp_notifications && user.phone) {
    attempted = true;
    const result = await sendWhatsApp({ to: user.phone, message });
    if (result.success) channels.push('whatsapp');
  }

  if (!attempted) return { success: true };

  await NotificationLog.create({
    workspace_id: workspaceValue(context),
    user_id: userId,
    type,
    subject,
    message,
    channels,
    status: channels.length > 0 ? 'sent' : 'failed',
  });

  return channels.length > 0
    ? { success: true }
    : { success: false, error: 'All enabled notification channels failed' };
}

export async function getNotificationLogs(limit = 50) {
  await connectDB();
  const context = await requireWorkspaceContext();
  const safeLimit = Math.max(1, Math.min(limit, 200));

  const logs = await NotificationLog.find(workspaceFilter(context, { user_id: context.user.id }))
    .sort({ created_at: -1 })
    .limit(safeLimit)
    .lean({ virtuals: true });

  return (logs as any[]).map((log) => ({ ...log, id: log._id.toString() }));
}
