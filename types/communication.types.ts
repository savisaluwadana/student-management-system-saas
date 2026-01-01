export type CommunicationChannel = 'email' | 'sms' | 'both';
export type CommunicationStatus = 'pending' | 'sent' | 'failed' | 'scheduled';
export type RecipientType = 'student' | 'class' | 'all';

export interface Communication {
  id: string;
  recipient_type: RecipientType;
  recipient_id: string | null;
  channel: CommunicationChannel;
  subject: string | null;
  message: string;
  status: CommunicationStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SendCommunicationInput {
  recipient_type: RecipientType;
  recipient_id?: string;
  channel: CommunicationChannel;
  subject?: string;
  message: string;
  scheduled_at?: string;
}
