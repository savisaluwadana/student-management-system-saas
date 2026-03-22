'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Institute from '@/lib/mongodb/models/Institute';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';

export interface InstituteType {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// Backward-compatibility alias
export type Institute = InstituteType;

export interface InstituteSummary extends InstituteType {
  total_students: number;
  total_classes: number;
}

export async function getInstitutes() {
  await connectDB();
  const institutes = await Institute.find({}).sort({ name: 1 }).lean({ virtuals: true });
  return institutes.map((i: any) => ({ ...i, id: i._id.toString() })) as InstituteType[];
}

export async function getInstituteSummaries() {
  await connectDB();
  const institutes = await Institute.find({}).sort({ name: 1 }).lean({ virtuals: true });

  return await Promise.all(
    (institutes as any[]).map(async (inst) => {
      const [total_students, total_classes] = await Promise.all([
        Student.countDocuments({ institute_id: inst._id }),
        Class.countDocuments({ institute_id: inst._id }),
      ]);
      return { ...inst, id: inst._id.toString(), total_students, total_classes };
    })
  ) as InstituteSummary[];
}

export async function getInstituteById(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;
  const inst = await Institute.findById(id).lean({ virtuals: true });
  if (!inst) return null;
  const i = inst as any;
  return { ...i, id: i._id.toString() } as InstituteType;
}

export async function createInstitute(formData: FormData) {
  await connectDB();

  const instituteData = {
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    address: (formData.get('address') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    status: (formData.get('status') as string) || 'active',
  };

  try {
    const inst = await Institute.create(instituteData);
    revalidatePath('/institutes');
    return { success: true, data: { ...instituteData, id: inst._id.toHexString() } };
  } catch (error: any) {
    console.error('Error creating institute:', error);
    return { success: false, error: error.message };
  }
}

export async function updateInstitute(id: string, formData: FormData) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const instituteData = {
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    address: formData.get('address') as string || null,
    phone: formData.get('phone') as string || null,
    email: formData.get('email') as string || null,
    status: formData.get('status') as string || 'active',
  };

  try {
    const inst = await Institute.findByIdAndUpdate(id, instituteData, { new: true }).lean({ virtuals: true });
    revalidatePath('/institutes');
    return { success: true, data: inst };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInstitute(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await Institute.findByIdAndDelete(id);
    revalidatePath('/institutes');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
