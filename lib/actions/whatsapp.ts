'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

/**
 * Send a single WhatsApp message
 * Note: This is a mock implementation. In production, integrate with WhatsApp Business API
 */
export async function sendWhatsAppMessage(
  messageData: WhatsAppMessage
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate phone number format (should be in E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(messageData.to)) {
      return { 
        success: false, 
        error: 'Invalid phone number format. Use E.164 format (e.g., +94771234567)' 
      };
    }

    // In production, this would call WhatsApp Business API
    // For now, we'll simulate the API call and log the message
    const mockApiResponse = await simulateWhatsAppAPI(messageData);

    if (!mockApiResponse.success) {
      return { success: false, error: mockApiResponse.error };
    }

    // Log the message in database
    const { data: logData, error: logError } = await supabase
      .from('communication_logs')
      .insert({
        user_id: user.id,
        channel: 'whatsapp',
        recipient: messageData.to,
        message: messageData.message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        external_id: mockApiResponse.messageId,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging WhatsApp message:', logError);
    }

    return { 
      success: true, 
      messageId: mockApiResponse.messageId 
    };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { 
      success: false, 
      error: 'Failed to send WhatsApp message' 
    };
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendBulkWhatsAppMessages(
  bulkData: WhatsAppBulkMessage
): Promise<{ success: boolean; error?: string; sent: number; failed: number }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized', sent: 0, failed: 0 };
    }

    let recipients: string[] = [];

    // Get recipients based on type
    if (bulkData.type === 'class' && bulkData.classId) {
      // Get all students in the class with WhatsApp numbers
      const { data: students } = await supabase
        .from('enrollments')
        .select(`
          students (
            whatsapp_phone,
            guardian_phone
          )
        `)
        .eq('class_id', bulkData.classId)
        .eq('status', 'active');

      recipients = students
        ?.map((enrollment: any) => 
          enrollment.students?.whatsapp_phone || enrollment.students?.guardian_phone
        )
        .filter(Boolean) || [];
    } else if (bulkData.type === 'all') {
      // Get all active students with WhatsApp numbers
      const { data: students } = await supabase
        .from('students')
        .select('whatsapp_phone, guardian_phone')
        .eq('status', 'active');

      recipients = students
        ?.map(student => student.whatsapp_phone || student.guardian_phone)
        .filter(Boolean) || [];
    } else if (bulkData.type === 'custom') {
      recipients = bulkData.recipients;
    }

    if (recipients.length === 0) {
      return { 
        success: false, 
        error: 'No valid recipients found', 
        sent: 0, 
        failed: 0 
      };
    }

    // Send messages to all recipients
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const result = await sendWhatsAppMessage({
        to: recipient,
        message: bulkData.message,
        type: 'text',
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    revalidatePath('/communications');

    return {
      success: true,
      sent,
      failed,
    };
  } catch (error) {
    console.error('Error sending bulk WhatsApp messages:', error);
    return {
      success: false,
      error: 'Failed to send bulk messages',
      sent: 0,
      failed: 0,
    };
  }
}

/**
 * Get WhatsApp message templates
 */
export async function getWhatsAppTemplates() {
  // Mock templates - in production, fetch from WhatsApp Business API
  return [
    {
      name: 'payment_reminder',
      displayName: 'Payment Reminder',
      message: 'Hi {{student_name}}, this is a reminder that your payment of LKR {{amount}} is due on {{due_date}}. Please make the payment at your earliest convenience.',
      params: ['student_name', 'amount', 'due_date'],
    },
    {
      name: 'attendance_alert',
      displayName: 'Attendance Alert',
      message: 'Dear Parent, {{student_name}} was marked absent in {{class_name}} on {{date}}. Please contact us if you have any concerns.',
      params: ['student_name', 'class_name', 'date'],
    },
    {
      name: 'class_announcement',
      displayName: 'Class Announcement',
      message: 'Announcement for {{class_name}}: {{message}}',
      params: ['class_name', 'message'],
    },
    {
      name: 'assessment_result',
      displayName: 'Assessment Result',
      message: 'Hi {{student_name}}, your result for {{assessment_name}} is now available. Score: {{score}}/{{max_score}}. Keep up the good work!',
      params: ['student_name', 'assessment_name', 'score', 'max_score'],
    },
  ];
}

/**
 * Simulate WhatsApp Business API call
 * In production, replace with actual API integration
 */
async function simulateWhatsAppAPI(
  messageData: WhatsAppMessage
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate success rate (90% success in mock)
  const isSuccess = Math.random() > 0.1;

  if (isSuccess) {
    return {
      success: true,
      messageId: `wamid.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`,
    };
  } else {
    return {
      success: false,
      error: 'Message delivery failed (simulated)',
    };
  }
}

/**
 * Get WhatsApp message history
 */
export async function getWhatsAppHistory(limit: number = 50) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('channel', 'whatsapp')
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching WhatsApp history:', error);
    return [];
  }

  return data || [];
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string, countryCode: string = '+94'): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0, remove it
  const withoutLeadingZero = cleaned.startsWith('0') ? cleaned.substring(1) : cleaned;
  
  // Add country code if not present
  if (withoutLeadingZero.startsWith(countryCode.replace('+', ''))) {
    return '+' + withoutLeadingZero;
  }
  
  return countryCode + withoutLeadingZero;
}
