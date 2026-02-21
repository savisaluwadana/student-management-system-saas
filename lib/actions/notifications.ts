'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface NotificationPreference {
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

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferences(): Promise<NotificationPreference | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If preferences don't exist, create default ones
    if (error.code === 'PGRST116') {
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_notifications: true,
          sms_notifications: false,
          whatsapp_notifications: false,
          notify_payments: true,
          notify_attendance: true,
          notify_assessments: true,
          notify_enrollments: true,
          notify_announcements: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating notification preferences:', createError);
        return null;
      }

      return newPrefs;
    }

    console.error('Error fetching notification preferences:', error);
    return null;
  }

  return data;
}

/**
 * Update notification preferences for the current user
 */
export async function updateNotificationPreferences(
  input: UpdateNotificationPreferenceInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('notification_preferences')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Send notification based on user preferences
 * This is a mock implementation - in production, integrate with email/SMS/WhatsApp services
 */
export async function sendNotification(
  userId: string,
  type: 'payment' | 'attendance' | 'assessment' | 'enrollment' | 'announcement',
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  // Get user preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!prefs) {
    return { success: false, error: 'No notification preferences found' };
  }

  // Check if this notification type is enabled
  const typeKey = `notify_${type}s` as keyof NotificationPreference;
  if (!prefs[typeKey]) {
    return { success: true }; // User has disabled this type of notification
  }

  // Get user details
  const { data: userData } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .single();

  if (!userData) {
    return { success: false, error: 'User not found' };
  }

  const notifications: string[] = [];

  // Send email if enabled
  if (prefs.email_notifications && userData.email) {
    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    notifications.push('email');
    console.log(`[EMAIL] To: ${userData.email}, Subject: ${subject}, Message: ${message}`);
  }

  // Send SMS if enabled
  if (prefs.sms_notifications && userData.phone) {
    // TODO: Integrate with SMS service (Twilio, etc.)
    notifications.push('sms');
    console.log(`[SMS] To: ${userData.phone}, Message: ${message}`);
  }

  // Send WhatsApp if enabled
  if (prefs.whatsapp_notifications && userData.phone) {
    // TODO: Integrate with WhatsApp Business API
    notifications.push('whatsapp');
    console.log(`[WhatsApp] To: ${userData.phone}, Message: ${message}`);
  }

  if (notifications.length === 0) {
    return { success: true }; // User has all notification channels disabled
  }

  // Log the notification
  await supabase.from('notification_logs').insert({
    user_id: userId,
    type,
    subject,
    message,
    channels: notifications,
    status: 'sent',
  });

  return { success: true };
}

/**
 * Get notification logs for the current user
 */
export async function getNotificationLogs(limit: number = 50) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('notification_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notification logs:', error);
    return [];
  }

  return data || [];
}
