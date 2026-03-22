'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import type { Student as StudentType, CreateStudentInput, UpdateStudentInput } from '@/types/student.types';

function docToStudent(doc: any): StudentType {
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : doc;
  return { ...obj, id: obj._id?.toString() || obj.id };
}

/**
 * Get all students with optional filtering
 */
export async function getStudents(status?: string): Promise<StudentType[]> {
  await connectDB();

  const filter: any = {};
  if (status) filter.status = status;

  const students = await Student.find(filter).sort({ created_at: -1 }).lean({ virtuals: true });

  // Attach enrollments with class data
  const result = await Promise.all(
    students.map(async (s: any) => {
      const enrollments = await Enrollment.find({ student_id: s._id, status: 'active' })
        .populate('class_id', 'id class_name class_code')
        .lean({ virtuals: true });
      return {
        ...s,
        id: s._id.toString(),
        enrollments: enrollments.map((e: any) => ({
          class: {
            id: e.class_id?._id?.toString(),
            class_name: e.class_id?.class_name,
            class_code: e.class_id?.class_code,
          },
        })),
      };
    })
  );

  return result as unknown as StudentType[];
}

/**
 * Get a single student by ID
 */
export async function getStudentById(id: string): Promise<StudentType | null> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return null;

  const student = await Student.findById(id).lean({ virtuals: true });
  if (!student) return null;

  const s = student as any;
  const enrollments = await Enrollment.find({ student_id: s._id, status: 'active' })
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  return {
    ...s,
    id: s._id.toString(),
    enrollments: enrollments.map((e: any) => ({
      class: {
        id: e.class_id?._id?.toString(),
        class_name: e.class_id?.class_name,
        class_code: e.class_id?.class_code,
      },
    })),
  } as unknown as StudentType;
}

/**
 * Create a new student
 */
export async function createStudent(input: CreateStudentInput): Promise<{ success: boolean; error?: string; id?: string }> {
  await connectDB();

  const { class_ids, ...studentData } = input;

  try {
    const student = await Student.create(studentData);

    if (class_ids && class_ids.length > 0) {
      const enrollments = class_ids.map((classId) => ({
        student_id: student._id,
        class_id: classId,
        status: 'active',
      }));
      await Enrollment.insertMany(enrollments, { ordered: false });
    }

    revalidatePath('/students');
    return { success: true, id: student._id.toHexString() };
  } catch (error: any) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an existing student
 */
export async function updateStudent(id: string, input: UpdateStudentInput): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const { class_ids, ...studentData } = input;

  try {
    await Student.findByIdAndUpdate(id, studentData);

    if (class_ids !== undefined) {
      const currentEnrollments = await Enrollment.find({ student_id: id }).select('class_id').lean();
      const currentClassIds = currentEnrollments.map((e: any) => e.class_id.toString());

      const classesToAdd = class_ids.filter((cid) => !currentClassIds.includes(cid));
      const classesToRemove = currentClassIds.filter((cid) => !class_ids.includes(cid));

      if (classesToAdd.length > 0) {
        await Enrollment.insertMany(
          classesToAdd.map((classId) => ({ student_id: id, class_id: classId, status: 'active' })),
          { ordered: false }
        );
      }

      if (classesToRemove.length > 0) {
        await Enrollment.deleteMany({ student_id: id, class_id: { $in: classesToRemove } });
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

/**
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await Student.findByIdAndDelete(id);
    await Enrollment.deleteMany({ student_id: id });
    revalidatePath('/students');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get student payment summary
 */
export async function getStudentPaymentSummary(studentId: string) {
  await connectDB();
  const FeePayment = (await import('@/lib/mongodb/models/FeePayment')).default;

  const payments = await FeePayment.find({ student_id: studentId }).lean();
  const total = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
  const paid = payments.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + p.amount, 0);
  const pending = payments.filter((p: any) => p.status === 'pending' || p.status === 'overdue').reduce((sum: number, p: any) => sum + p.amount, 0);

  return { student_id: studentId, total_amount: total, paid_amount: paid, pending_amount: pending };
}

/**
 * Bulk create students from CSV import
 */
export async function bulkCreateStudents(
  students: CreateStudentInput[]
): Promise<{ success: boolean; imported?: number; failed?: number; errors?: string[] }> {
  await connectDB();

  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  const batchSize = 50;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize).map(({ class_ids, ...rest }) => rest);
    try {
      const result = await Student.insertMany(batch, { ordered: false });
      imported += result.length;
    } catch (error: any) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      failed += batch.length;
    }
  }

  revalidatePath('/students');
  return { success: errors.length === 0, imported, failed, errors: errors.length > 0 ? errors : undefined };
}

/**
 * Get all students for export
 */
export async function getAllStudentsForExport(): Promise<StudentType[]> {
  await connectDB();
  const students = await Student.find({}).sort({ student_code: 1 }).lean({ virtuals: true });
  return students.map((s: any) => ({ ...s, id: s._id.toString() })) as unknown as StudentType[];
}

/**
 * Get all active enrollments for a student
 */
export async function getStudentEnrollments(studentId: string): Promise<string[]> {
  await connectDB();
  const enrollments = await Enrollment.find({ student_id: studentId, status: 'active' }).select('class_id').lean();
  return enrollments.map((e: any) => e.class_id.toString());
}
