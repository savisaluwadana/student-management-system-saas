'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Class from '@/lib/mongodb/models/Class';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import mongoose from 'mongoose';
import type { Class as ClassType, CreateClassInput, UpdateClassInput } from '@/types/class.types';

/**
 * Get all classes with optional filtering
 */
export async function getClasses(status?: string): Promise<ClassType[]> {
  await connectDB();

  const filter: any = {};
  if (status) filter.status = status;

  const classes = await Class.find(filter)
    .sort({ created_at: -1 })
    .lean({ virtuals: true });

  return classes.map((c: any) => ({ ...c, id: c._id.toString() })) as unknown as ClassType[];
}

/**
 * Get a single class by ID
 */
export async function getClassById(id: string): Promise<ClassType | null> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return null;

  const cls = await Class.findById(id).lean({ virtuals: true });
  if (!cls) return null;

  const c = cls as any;
  return { ...c, id: c._id.toString() } as unknown as ClassType;
}

/**
 * Create a new class
 */
export async function createClass(input: CreateClassInput): Promise<{ success: boolean; error?: string; id?: string }> {
  await connectDB();

  try {
    const cls = await Class.create(input);
    revalidatePath('/classes');
    return { success: true, id: cls._id.toHexString() };
  } catch (error: any) {
    console.error('Error creating class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing class
 */
export async function updateClass(id: string, input: UpdateClassInput): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await Class.findByIdAndUpdate(id, input);
    revalidatePath('/classes');
    revalidatePath(`/classes/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a class
 */
export async function deleteClass(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await Class.findByIdAndDelete(id);
    revalidatePath('/classes');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Enroll a student in a class
 */
export async function enrollStudent(studentId: string, classId: string, customFee?: number): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  try {
    await Enrollment.findOneAndUpdate(
      { student_id: studentId, class_id: classId },
      { student_id: studentId, class_id: classId, custom_fee: customFee, status: 'active' },
      { upsert: true, new: true }
    );

    revalidatePath('/classes');
    revalidatePath(`/classes/${classId}`);
    revalidatePath('/students');
    revalidatePath(`/students/${studentId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error enrolling student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unenroll a student from a class (mark as dropped)
 */
export async function unenrollStudent(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  if (!mongoose.isValidObjectId(enrollmentId)) return { success: false, error: 'Invalid ID' };

  try {
    await Enrollment.findByIdAndUpdate(enrollmentId, { status: 'dropped' });
    revalidatePath('/classes');
    revalidatePath('/students');
    return { success: true };
  } catch (error: any) {
    console.error('Error unenrolling student:', error);
    return { success: false, error: error.message };
  }
}
