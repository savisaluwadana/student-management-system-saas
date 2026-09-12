'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Institute from '@/lib/mongodb/models/Institute';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import { checkWorkspaceLimit } from '@/lib/actions/billing';
import { requireWorkspaceContext, workspaceFilter, workspaceValue } from '@/lib/saas/workspace';

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

export type Institute = InstituteType;

export interface InstituteSummary extends InstituteType {
  total_students: number;
  total_classes: number;
}

export async function getInstitutes() {
  await connectDB();
  const context = await requireWorkspaceContext();
  const institutes = await Institute.find(workspaceFilter(context, {})).sort({ name: 1 }).lean({ virtuals: true });
  return institutes.map((institute: any) => ({ ...institute, id: institute._id.toString() })) as InstituteType[];
}

export async function getInstituteSummaries() {
  await connectDB();
  const context = await requireWorkspaceContext();
  const institutes = await Institute.find(workspaceFilter(context, {})).sort({ name: 1 }).lean({ virtuals: true });

  return await Promise.all(
    (institutes as any[]).map(async (institute) => {
      const [total_students, total_classes] = await Promise.all([
        Student.countDocuments(workspaceFilter(context, { institute_id: institute._id })),
        Class.countDocuments(workspaceFilter(context, { institute_id: institute._id })),
      ]);
      return { ...institute, id: institute._id.toString(), total_students, total_classes };
    })
  ) as InstituteSummary[];
}

export async function getInstituteById(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;
  const institute = await Institute.findOne(workspaceFilter(context, { _id: id })).lean({ virtuals: true });
  if (!institute) return null;
  const item = institute as any;
  return { ...item, id: item._id.toString() } as InstituteType;
}

export async function createInstitute(formData: FormData) {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });

  const instituteData = {
    code: String(formData.get('code') || '').trim(),
    name: String(formData.get('name') || '').trim(),
    address: (formData.get('address') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    status: (formData.get('status') as string) || 'active',
  };

  if (!instituteData.code || !instituteData.name) {
    return { success: false, error: 'Branch code and name are required.' };
  }

  try {
    const limit = await checkWorkspaceLimit('branches');
    if (!limit.allowed) return { success: false, error: limit.error };

    const existing = await Institute.exists(workspaceFilter(context, { code: instituteData.code }));
    if (existing) return { success: false, error: 'A branch with this code already exists in your workspace.' };

    const institute = await Institute.create({
      ...instituteData,
      workspace_id: workspaceValue(context),
    });
    revalidatePath('/institutes');
    revalidatePath('/billing');
    return { success: true, data: { ...instituteData, id: institute._id.toHexString() } };
  } catch (error: any) {
    console.error('Error creating institute:', error);
    return { success: false, error: error.message };
  }
}

export async function updateInstitute(id: string, formData: FormData) {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const instituteData = {
    code: String(formData.get('code') || '').trim(),
    name: String(formData.get('name') || '').trim(),
    address: (formData.get('address') as string) || null,
    phone: (formData.get('phone') as string) || null,
    email: (formData.get('email') as string) || null,
    status: (formData.get('status') as string) || 'active',
  };

  try {
    const duplicate = await Institute.exists(
      workspaceFilter(context, { _id: { $ne: id }, code: instituteData.code })
    );
    if (duplicate) return { success: false, error: 'A branch with this code already exists in your workspace.' };

    const institute = await Institute.findOneAndUpdate(
      workspaceFilter(context, { _id: id }),
      instituteData,
      { new: true }
    ).lean({ virtuals: true });
    if (!institute) return { success: false, error: 'Branch not found.' };

    revalidatePath('/institutes');
    return { success: true, data: institute };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInstitute(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const [students, classes] = await Promise.all([
      Student.countDocuments(workspaceFilter(context, { institute_id: id })),
      Class.countDocuments(workspaceFilter(context, { institute_id: id })),
    ]);
    if (students > 0 || classes > 0) {
      return { success: false, error: 'Move or remove students and classes before deleting this branch.' };
    }

    const deleted = await Institute.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!deleted) return { success: false, error: 'Branch not found.' };
    revalidatePath('/institutes');
    revalidatePath('/billing');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
