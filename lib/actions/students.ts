'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Class from '@/lib/mongodb/models/Class';
import Institute from '@/lib/mongodb/models/Institute';
import mongoose from 'mongoose';
import type { Student as StudentType, CreateStudentInput, UpdateStudentInput } from '@/types/student.types';
import { checkWorkspaceLimit, getBillingSummary } from '@/lib/actions/billing';
import { requireWorkspaceContext, workspaceFilter, workspaceValue, type WorkspaceContext } from '@/lib/saas/workspace';

function randomSixDigits(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniqueStudentCode(context: WorkspaceContext): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);

  for (let i = 0; i < 10; i++) {
    const code = `STD${year}${randomSixDigits()}`;
    const exists = await Student.exists(workspaceFilter(context, { student_code: code }));
    if (!exists) return code;
  }

  throw new Error('Failed to generate unique student ID. Please try again.');
}

async function generateUniqueBarcode(context: WorkspaceContext): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);

  for (let i = 0; i < 10; i++) {
    const barcode = `STU${year}${randomSixDigits()}`;
    const exists = await Student.exists(workspaceFilter(context, { barcode }));
    if (!exists) return barcode;
  }

  throw new Error('Failed to generate unique QR/barcode. Please try again.');
}

async function validateInstitute(instituteId: string | undefined, context: WorkspaceContext) {
  if (!instituteId) return true;
  if (!mongoose.isValidObjectId(instituteId)) return false;
  return Boolean(await Institute.exists(workspaceFilter(context, { _id: instituteId })));
}

async function validateClassIds(classIds: string[] | undefined, context: WorkspaceContext) {
  if (!classIds || classIds.length === 0) return true;
  if (classIds.some((id) => !mongoose.isValidObjectId(id))) return false;
  const count = await Class.countDocuments(workspaceFilter(context, { _id: { $in: classIds } }));
  return count === new Set(classIds).size;
}

/** Get all students with optional filtering. */
export async function getStudents(status?: string): Promise<StudentType[]> {
  await connectDB();
  const context = await requireWorkspaceContext();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const students = await Student.find(workspaceFilter(context, filter))
    .sort({ created_at: -1 })
    .lean({ virtuals: true });

  const result = await Promise.all(
    students.map(async (student: any) => {
      const enrollments = await Enrollment.find(
        workspaceFilter(context, { student_id: student._id, status: 'active' })
      )
        .populate('class_id', 'id class_name class_code')
        .lean({ virtuals: true });

      return {
        ...student,
        id: student._id.toString(),
        enrollments: enrollments.map((enrollment: any) => ({
          class: {
            id: enrollment.class_id?._id?.toString(),
            class_name: enrollment.class_id?.class_name,
            class_code: enrollment.class_id?.class_code,
          },
        })),
      };
    })
  );

  return result as unknown as StudentType[];
}

export async function getStudentById(id: string): Promise<StudentType | null> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;

  const student = await Student.findOne(workspaceFilter(context, { _id: id })).lean({ virtuals: true });
  if (!student) return null;

  const s = student as any;
  const enrollments = await Enrollment.find(workspaceFilter(context, { student_id: s._id, status: 'active' }))
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  return {
    ...s,
    id: s._id.toString(),
    enrollments: enrollments.map((enrollment: any) => ({
      class: {
        id: enrollment.class_id?._id?.toString(),
        class_name: enrollment.class_id?.class_name,
        class_code: enrollment.class_id?.class_code,
      },
    })),
  } as unknown as StudentType;
}

export async function createStudent(input: CreateStudentInput): Promise<{ success: boolean; error?: string; id?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  try {
    const limit = await checkWorkspaceLimit('students');
    if (!limit.allowed) return { success: false, error: limit.error };

    const { class_ids, ...studentData } = input;
    if (!(await validateInstitute(studentData.institute_id, context))) {
      return { success: false, error: 'Invalid institute for this workspace.' };
    }
    if (!(await validateClassIds(class_ids, context))) {
      return { success: false, error: 'One or more selected classes do not belong to this workspace.' };
    }

    const student_code = input.student_code?.trim() || await generateUniqueStudentCode(context);
    const existingByCode = await Student.exists(workspaceFilter(context, { student_code }));
    if (existingByCode) {
      return { success: false, error: 'Student ID already exists in this workspace.' };
    }

    const barcode = await generateUniqueBarcode(context);
    const student = await Student.create({
      ...studentData,
      workspace_id: workspaceValue(context),
      student_code,
      barcode,
      joining_date: studentData.joining_date || new Date().toISOString().split('T')[0],
    });

    if (class_ids && class_ids.length > 0) {
      await Enrollment.insertMany(
        class_ids.map((classId) => ({
          workspace_id: workspaceValue(context),
          student_id: student._id,
          class_id: classId,
          status: 'active',
        })),
        { ordered: false }
      );
    }

    revalidatePath('/students');
    revalidatePath('/dashboard');
    return { success: true, id: student._id.toHexString() };
  } catch (error: any) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
}

export async function updateStudent(id: string, input: UpdateStudentInput): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const { class_ids, ...studentData } = input;

  try {
    if (!(await validateInstitute(studentData.institute_id, context))) {
      return { success: false, error: 'Invalid institute for this workspace.' };
    }
    if (!(await validateClassIds(class_ids, context))) {
      return { success: false, error: 'One or more selected classes do not belong to this workspace.' };
    }

    const student = await Student.findOneAndUpdate(
      workspaceFilter(context, { _id: id }),
      studentData,
      { new: true }
    );
    if (!student) return { success: false, error: 'Student not found.' };

    if (class_ids !== undefined) {
      const currentEnrollments = await Enrollment.find(workspaceFilter(context, { student_id: id }))
        .select('class_id')
        .lean();
      const currentClassIds = currentEnrollments.map((enrollment: any) => enrollment.class_id.toString());

      const classesToAdd = class_ids.filter((classId) => !currentClassIds.includes(classId));
      const classesToRemove = currentClassIds.filter((classId) => !class_ids.includes(classId));

      if (classesToAdd.length > 0) {
        await Enrollment.insertMany(
          classesToAdd.map((classId) => ({
            workspace_id: workspaceValue(context),
            student_id: id,
            class_id: classId,
            status: 'active',
          })),
          { ordered: false }
        );
      }

      if (classesToRemove.length > 0) {
        await Enrollment.deleteMany(
          workspaceFilter(context, { student_id: id, class_id: { $in: classesToRemove } })
        );
      }
    }

    revalidatePath('/students');
    revalidatePath(`/students/${id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const deleted = await Student.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!deleted) return { success: false, error: 'Student not found.' };
    await Enrollment.deleteMany(workspaceFilter(context, { student_id: id }));
    revalidatePath('/students');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
}

export async function getStudentPaymentSummary(studentId: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  const FeePayment = (await import('@/lib/mongodb/models/FeePayment')).default;

  const payments = await FeePayment.find(workspaceFilter(context, { student_id: studentId })).lean();
  const total = payments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
  const paid = payments.filter((payment: any) => payment.status === 'paid').reduce((sum: number, payment: any) => sum + payment.amount, 0);
  const pending = payments
    .filter((payment: any) => payment.status === 'pending' || payment.status === 'overdue')
    .reduce((sum: number, payment: any) => sum + payment.amount, 0);

  return { student_id: studentId, total_amount: total, paid_amount: paid, pending_amount: pending };
}

export async function bulkCreateStudents(
  students: CreateStudentInput[]
): Promise<{ success: boolean; imported?: number; failed?: number; errors?: string[] }> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });

  const billing = await getBillingSummary();
  if (billing.plan.studentLimit !== null && billing.usage.students.current + students.length > billing.plan.studentLimit) {
    return {
      success: false,
      imported: 0,
      failed: students.length,
      errors: [`Import would exceed the ${billing.plan.name} plan limit of ${billing.plan.studentLimit} students.`],
    };
  }

  const errors: string[] = [];
  let imported = 0;
  let failed = 0;
  const batchSize = 50;

  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize).map(({ class_ids, ...rest }) => ({
      ...rest,
      workspace_id: workspaceValue(context),
    }));
    try {
      const result = await Student.insertMany(batch, { ordered: false });
      imported += result.length;
    } catch (error: any) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      failed += batch.length;
    }
  }

  revalidatePath('/students');
  revalidatePath('/dashboard');
  return { success: errors.length === 0, imported, failed, errors: errors.length > 0 ? errors : undefined };
}

export async function getAllStudentsForExport(): Promise<StudentType[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const students = await Student.find(workspaceFilter(context, {})).sort({ student_code: 1 }).lean({ virtuals: true });
  return students.map((student: any) => ({ ...student, id: student._id.toString() })) as unknown as StudentType[];
}

export async function getStudentEnrollments(studentId: string): Promise<string[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const enrollments = await Enrollment.find(workspaceFilter(context, { student_id: studentId, status: 'active' }))
    .select('class_id')
    .lean();
  return enrollments.map((enrollment: any) => enrollment.class_id.toString());
}
