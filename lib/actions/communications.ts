'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import mongoose, { Schema, Model } from 'mongoose';
import { requireWorkspaceContext, workspaceFilter, workspaceValue } from '@/lib/saas/workspace';

interface ICommunication {
  _id: mongoose.Types.ObjectId;
  workspace_id?: mongoose.Types.ObjectId;
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
    workspace_id: { type: Schema.Types.ObjectId, ref: 'Workspace', index: true },
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
  const context = await requireWorkspaceContext();
  const communications = await Communication.find(workspaceFilter(context, {}))
    .sort({ created_at: -1 })
    .populate('created_by', 'full_name')
    .lean({ virtuals: true });

  return (communications as any[]).map((communication) => ({
    ...communication,
    id: communication._id.toString(),
    profiles: communication.created_by ? { full_name: communication.created_by.full_name } : undefined,
  })) as CommunicationType[];
}

export async function createCommunication(input: Partial<CreateCommunicationInput>): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  if (!input.recipient_type || !input.channel || !input.message?.trim()) {
    return { success: false, error: 'Recipient, channel, and message are required.' };
  }

  if (input.recipient_type !== 'all') {
    if (!input.recipient_id || !mongoose.isValidObjectId(input.recipient_id)) {
      return { success: false, error: 'A valid recipient is required.' };
    }

    const recipientExists = input.recipient_type === 'student'
      ? await Student.exists(workspaceFilter(context, { _id: input.recipient_id }))
      : await Class.exists(workspaceFilter(context, { _id: input.recipient_id }));

    if (!recipientExists) return { success: false, error: 'Recipient does not belong to this workspace.' };
  }

  try {
    await Communication.create({
      workspace_id: workspaceValue(context),
      recipient_type: input.recipient_type,
      recipient_id: input.recipient_id ?? undefined,
      channel: input.channel,
      subject: input.subject?.trim() || undefined,
      message: input.message.trim(),
      status: 'pending',
      created_by: context.user.id,
    });
    revalidatePath('/communications');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating communication:', error);
    return { success: false, error: error.message };
  }
}
