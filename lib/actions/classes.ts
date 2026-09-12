'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Class from '@/lib/mongodb/models/Class';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Student from '@/lib/mongodb/models/Student';
import User from '@/lib/mongodb/models/User';
import Institute from '@/lib/mongodb/models/Institute';
import mongoose from 'mongoose';
import type { Class as ClassType, CreateClassInput, UpdateClassInput } from '@/types/class.types';
import { requireWorkspaceContext, workspaceFilter, workspaceValue, type WorkspaceContext } from '@/lib/saas/workspace';

async function validateRelations(
  input: { institute_id?: string; teacher_id?: string },
  context: WorkspaceContext
): Promise<string | null> {
  if (input.institute_id) {
    if (!mongoose.isValidObjectId(input.institute_id)) return 'Invalid institute.';
    const institute = await Institute.exists(workspaceFilter(context, { _id: input.institute_id }));
    if (!institute) return 'Institute does not belong to this workspace.';
  }

  if (input.teacher_id) {
    if (!mongoose.isValidObjectId(input.teacher_id)) return 'Invalid teacher.';
    const teacher = await User.exists(workspaceFilter(context, { _id: input.teacher_id, role: 'teacher' }));
    if (!teacher) return 'Teacher does not belong to this workspace.';
  }

  return null;
}

export async function getClasses(status?: string): Promise<ClassType[]> {
  await connectDB();
  const context = await requireWorkspaceContext();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const classes = await Class.find(workspaceFilter(context, filter))
    .sort({ created_at: -1 })
    .lean({ virtuals: true });

  return classes.map((classItem: any) => ({
    ...classItem,
    id: classItem._id.toString(),
    monthly_fee: classItem.monthly_fee ?? classItem.fee_amount ?? 0,
    fee_collection_type: classItem.fee_collection_type || 'monthly',
  })) as unknown as ClassType[];
}

export async function getClassById(id: string): Promise<ClassType | null> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;

  const classItem = await Class.findOne(workspaceFilter(context, { _id: id })).lean({ virtuals: true });
  if (!classItem) return null;

  const cls = classItem as any;
  return {
    ...cls,
    id: cls._id.toString(),
    monthly_fee: cls.monthly_fee ?? cls.fee_amount ?? 0,
    fee_collection_type: cls.fee_collection_type || 'monthly',
  } as unknown as ClassType;
}

export async function createClass(input: CreateClassInput): Promise<{ success: boolean; error?: string; id?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  try {
    const relationError = await validateRelations(input as any, context);
    if (relationError) return { success: false, error: relationError };

    const { monthly_fee, ...rest } = input;
    const classItem = await Class.create({
      ...rest,
      workspace_id: workspaceValue(context),
      fee_amount: monthly_fee,
      fee_collection_type: input.fee_collection_type || 'monthly',
    });
    revalidatePath('/classes');
    revalidatePath('/dashboard');
    return { success: true, id: classItem._id.toHexString() };
  } catch (error: any) {
    console.error('Error creating class:', error);
    return { success: false, error: error.message };
  }
}

export async function updateClass(id: string, input: UpdateClassInput): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const relationError = await validateRelations(input as any, context);
    if (relationError) return { success: false, error: relationError };

    const { monthly_fee, ...rest } = input;
    const updated = await Class.findOneAndUpdate(
      workspaceFilter(context, { _id: id }),
      {
        ...rest,
        ...(monthly_fee !== undefined ? { fee_amount: monthly_fee } : {}),
      },
      { new: true }
    );
    if (!updated) return { success: false, error: 'Class not found.' };

    revalidatePath('/classes');
    revalidatePath(`/classes/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating class:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteClass(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const deleted = await Class.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!deleted) return { success: false, error: 'Class not found.' };
    await Enrollment.deleteMany(workspaceFilter(context, { class_id: id }));
    revalidatePath('/classes');
    revalidatePath('/students');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting class:', error);
    return { success: false, error: error.message };
  }
}

export async function enrollStudent(studentId: string, classId: string, customFee?: number): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  if (!mongoose.isValidObjectId(studentId) || !mongoose.isValidObjectId(classId)) {
    return { success: false, error: 'Invalid student or class.' };
  }

  try {
    const [student, classItem] = await Promise.all([
      Student.exists(workspaceFilter(context, { _id: studentId })),
      Class.exists(workspaceFilter(context, { _id: classId })),
    ]);
    if (!student || !classItem) return { success: false, error: 'Student or class not found in this workspace.' };

    await Enrollment.findOneAndUpdate(
      workspaceFilter(context, { student_id: studentId, class_id: classId }),
      {
        workspace_id: workspaceValue(context),
        student_id: studentId,
        class_id: classId,
        custom_fee: customFee,
        status: 'active',
      },
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

export async function unenrollStudent(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(enrollmentId)) return { success: false, error: 'Invalid ID' };

  try {
    const updated = await Enrollment.findOneAndUpdate(
      workspaceFilter(context, { _id: enrollmentId }),
      { status: 'dropped' },
      { new: true }
    );
    if (!updated) return { success: false, error: 'Enrollment not found.' };
    revalidatePath('/classes');
    revalidatePath('/students');
    return { success: true };
  } catch (error: any) {
    console.error('Error unenrolling student:', error);
    return { success: false, error: error.message };
  }
}
