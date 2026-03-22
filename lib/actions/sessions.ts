'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import ClassSession from '@/lib/mongodb/models/ClassSession';
import mongoose from 'mongoose';

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

  const sessions = await ClassSession.find({})
    .sort({ name: 1 })
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  return (sessions as any[]).map((s) => ({
    ...s,
    id: s._id.toString(),
    class_id: s.class_id?._id?.toString(),
    classes: {
      id: s.class_id?._id?.toString(),
      class_name: s.class_id?.class_name,
      class_code: s.class_id?.class_code,
    },
  })) as SessionWithClass[];
}

export async function getSessionsByClass(classId: string) {
  await connectDB();
  const sessions = await ClassSession.find({ class_id: classId, status: 'active' })
    .sort({ start_time: 1 })
    .lean({ virtuals: true });
  return (sessions as any[]).map((s) => ({ ...s, id: s._id.toString() })) as Session[];
}

export async function getSessionById(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;

  const session = await ClassSession.findById(id)
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  if (!session) return null;
  const s = session as any;
  return {
    ...s,
    id: s._id.toString(),
    class_id: s.class_id?._id?.toString(),
    classes: { id: s.class_id?._id?.toString(), class_name: s.class_id?.class_name, class_code: s.class_id?.class_code },
  } as SessionWithClass;
}

export async function createSession(formData: FormData) {
  await connectDB();

  const sessionData = {
    class_id: formData.get('class_id') as string,
    name: formData.get('name') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    days_of_week: formData.getAll('days_of_week') as string[],
    status: (formData.get('status') as string) || 'active',
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
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const sessionData = {
    class_id: formData.get('class_id') as string,
    name: formData.get('name') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    days_of_week: formData.getAll('days_of_week') as string[],
    status: formData.get('status') as string || 'active',
  };

  try {
    const session = await ClassSession.findByIdAndUpdate(id, sessionData, { new: true }).lean({ virtuals: true });
    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true, data: session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSession(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await ClassSession.findByIdAndDelete(id);
    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
