'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import ClassSession from '@/lib/mongodb/models/ClassSession';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import { requireWorkspaceContext, workspaceFilter, workspaceValue } from '@/lib/saas/workspace';

export interface Session {
  id: string;
  class_id: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface SessionWithClass extends Session {
  classes: { id: string; class_name: string; class_code: string };
}

export async function getSessions() {
  await connectDB();
  const context = await requireWorkspaceContext();

  const sessions = await ClassSession.find(workspaceFilter(context, {}))
    .sort({ name: 1 })
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  return (sessions as any[]).map((session) => ({
    ...session,
    id: session._id.toString(),
    class_id: session.class_id?._id?.toString(),
    classes: {
      id: session.class_id?._id?.toString(),
      class_name: session.class_id?.class_name,
      class_code: session.class_id?.class_code,
    },
  })) as SessionWithClass[];
}

export async function getSessionsByClass(classId: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(classId)) return [];

  const classExists = await Class.exists(workspaceFilter(context, { _id: classId }));
  if (!classExists) return [];

  const sessions = await ClassSession.find(workspaceFilter(context, { class_id: classId, status: 'active' }))
    .sort({ start_time: 1 })
    .lean({ virtuals: true });
  return (sessions as any[]).map((session) => ({ ...session, id: session._id.toString() })) as Session[];
}

export async function getSessionById(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;

  const session = await ClassSession.findOne(workspaceFilter(context, { _id: id }))
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  if (!session) return null;
  const data = session as any;
  return {
    ...data,
    id: data._id.toString(),
    class_id: data.class_id?._id?.toString(),
    classes: {
      id: data.class_id?._id?.toString(),
      class_name: data.class_id?.class_name,
      class_code: data.class_id?.class_code,
    },
  } as SessionWithClass;
}

export async function createSession(formData: FormData) {
  await connectDB();
  const context = await requireWorkspaceContext();

  const classId = String(formData.get('class_id') || '');
  if (!mongoose.isValidObjectId(classId)) return { success: false, error: 'Invalid class.' };
  const classExists = await Class.exists(workspaceFilter(context, { _id: classId }));
  if (!classExists) return { success: false, error: 'Class does not belong to this workspace.' };

  const sessionData = {
    workspace_id: workspaceValue(context),
    class_id: classId,
    name: String(formData.get('name') || '').trim(),
    start_time: String(formData.get('start_time') || ''),
    end_time: String(formData.get('end_time') || ''),
    days_of_week: formData.getAll('days_of_week') as string[],
    status: String(formData.get('status') || 'active'),
  };

  try {
    const session = await ClassSession.create(sessionData);
    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true, data: { ...sessionData, id: session._id.toHexString() } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSession(id: string, formData: FormData) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const classId = String(formData.get('class_id') || '');
  if (!mongoose.isValidObjectId(classId)) return { success: false, error: 'Invalid class.' };
  const classExists = await Class.exists(workspaceFilter(context, { _id: classId }));
  if (!classExists) return { success: false, error: 'Class does not belong to this workspace.' };

  const sessionData = {
    class_id: classId,
    name: String(formData.get('name') || '').trim(),
    start_time: String(formData.get('start_time') || ''),
    end_time: String(formData.get('end_time') || ''),
    days_of_week: formData.getAll('days_of_week') as string[],
    status: String(formData.get('status') || 'active'),
  };

  try {
    const session = await ClassSession.findOneAndUpdate(
      workspaceFilter(context, { _id: id }),
      sessionData,
      { new: true }
    ).lean({ virtuals: true });
    if (!session) return { success: false, error: 'Session not found.' };
    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true, data: session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSession(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const deleted = await ClassSession.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!deleted) return { success: false, error: 'Session not found.' };
    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
