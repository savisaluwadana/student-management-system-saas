'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import mongoose, { Schema, Model } from 'mongoose';
import { getCurrentUser } from '@/lib/auth/auth';

// Inline Communication schema (not a core entity, no separate model file needed)
interface ICommunication {
  _id: mongoose.Types.ObjectId;
  recipient_type: 'student' | 'class' | 'all';
  recipient_id?: string;
  channel: 'email' | 'sms' | 'both';
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  created_by?: mongoose.Types.ObjectId;
  sent_at?: Date;
  created_at: Date;
}

const CommunicationSchema = new Schema<ICommunication>(
  {
    recipient_type: { type: String, enum: ['student', 'class', 'all'], required: true },
    recipient_id: { type: String },
    channel: { type: String, enum: ['email', 'sms', 'both'], required: true },
    subject: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'sent', 'failed', 'scheduled'], default: 'pending' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
    sent_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
CommunicationSchema.virtual('id').get(function () { return this._id.toHexString(); });

const Communication: Model<ICommunication> =
  mongoose.models.Communication || mongoose.model<ICommunication>('Communication', CommunicationSchema);

export interface CommunicationType {
  id: string;
  recipient_type: 'student' | 'class' | 'all';
  recipient_id: string | null;
  channel: 'email' | 'sms' | 'both';
  subject: string | null;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'scheduled';
  created_at: string;
  created_by: string | null;
  profiles?: { full_name: string };
}

export type CreateCommunicationInput = Omit<CommunicationType, 'id' | 'created_at' | 'profiles'>;

export async function getCommunications() {
  await connectDB();
  const comms = await Communication.find({})
    .sort({ created_at: -1 })
    .populate('created_by', 'full_name')
    .lean({ virtuals: true });

  return (comms as any[]).map((c) => ({
    ...c,
    id: c._id.toString(),
    profiles: c.created_by ? { full_name: c.created_by.full_name } : undefined,
  })) as CommunicationType[];
}

export async function createCommunication(input: Partial<CreateCommunicationInput>): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const user = await getCurrentUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    const communicationData = {
      recipient_type: input.recipient_type,
      recipient_id: input.recipient_id ?? undefined,
      channel: input.channel,
      subject: input.subject ?? undefined,
      message: input.message,
      status: 'sent' as const,
      created_by: user.id,
      sent_at: new Date(),
    };
    await Communication.create(communicationData);
    revalidatePath('/communications');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating communication:', error);
    return { success: false, error: error.message };
  }
}
