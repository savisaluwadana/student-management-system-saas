'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type Teacher = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'teacher';
  created_at: string;
  classes?: { id: string; class_name: string; class_code: string }[];
};

export async function getTeachers(): Promise<Teacher[]> {
  await connectDB();

  const teachers = await User.find({ role: 'teacher' }).sort({ full_name: 1 }).lean({ virtuals: true });

  const result = await Promise.all(
    teachers.map(async (t: any) => {
      const classes = await Class.find({ teacher_id: t._id }).select('id class_name class_code').lean({ virtuals: true });
      return {
        ...t,
        id: t._id.toString(),
        classes: classes.map((c: any) => ({ id: c._id.toString(), class_name: c.class_name, class_code: c.class_code })),
      };
    })
  );

  return result as unknown as Teacher[];
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return null;

  const teacher = await User.findOne({ _id: id, role: 'teacher' }).lean({ virtuals: true });
  if (!teacher) return null;

  const t = teacher as any;
  const classes = await Class.find({ teacher_id: t._id }).select('id class_name class_code').lean({ virtuals: true });

  return {
    ...t,
    id: t._id.toString(),
    classes: classes.map((c: any) => ({ id: c._id.toString(), class_name: c.class_name, class_code: c.class_code })),
  } as unknown as Teacher;
}

export async function createTeacher(data: {
  full_name: string;
  email: string;
  phone?: string;
  class_ids?: string[];
}) {
  await connectDB();

  try {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return { success: false, error: 'A user with this email already exists.' };
    }

    const tempPassword = 'TempPassword123!';
    const teacher = await User.create({
      email: data.email.toLowerCase(),
      password: tempPassword,
      full_name: data.full_name,
      phone: data.phone,
      role: 'teacher',
    });

    if (data.class_ids && data.class_ids.length > 0) {
      await Class.updateMany({ _id: { $in: data.class_ids } }, { teacher_id: teacher._id });
    }

    revalidatePath('/teachers');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message };
  }
}

export async function updateTeacher(
  id: string,
  data: { full_name?: string; email?: string; phone?: string; class_ids?: string[] }
) {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const updateData: any = {};
    if (data.full_name) updateData.full_name = data.full_name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;

    await User.findByIdAndUpdate(id, updateData);

    if (data.class_ids !== undefined) {
      // Remove teacher from all currently assigned classes
      await Class.updateMany({ teacher_id: id }, { $unset: { teacher_id: 1 } });
      // Assign to new class list
      if (data.class_ids.length > 0) {
        await Class.updateMany({ _id: { $in: data.class_ids } }, { teacher_id: id });
      }
    }

    revalidatePath('/teachers');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating teacher:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTeacher(id: string) {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    // Unassign from classes first
    await Class.updateMany({ teacher_id: id }, { $unset: { teacher_id: 1 } });
    await User.findByIdAndDelete(id);
    revalidatePath('/teachers');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    return { success: false, error: error.message };
  }
}
