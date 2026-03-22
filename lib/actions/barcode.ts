'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import mongoose from 'mongoose';

export async function generateStudentBarcode(
  studentId: string
): Promise<{ success: boolean; barcode?: string; error?: string }> {
  await connectDB();
  if (!mongoose.isValidObjectId(studentId)) return { success: false, error: 'Invalid ID' };

  const student = await Student.findById(studentId).select('barcode student_code').lean();
  if (!student) return { success: false, error: 'Student not found' };

  const s = student as any;
  if (s.barcode) return { success: true, barcode: s.barcode };

  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(100000 + Math.random() * 900000).toString();
  const barcode = `STU${year}${random}`;

  await Student.findByIdAndUpdate(studentId, { barcode });
  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  return { success: true, barcode };
}

export async function generateBulkBarcodes(): Promise<{ success: boolean; count?: number; error?: string }> {
  await connectDB();

  const students = await Student.find({ $or: [{ barcode: { $exists: false } }, { barcode: null }, { barcode: '' }] }).select('_id').lean();
  if (!students.length) return { success: true, count: 0 };

  const year = new Date().getFullYear().toString().slice(-2);
  for (const student of students as any[]) {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    await Student.findByIdAndUpdate(student._id, { barcode: `STU${year}${random}` });
  }

  revalidatePath('/students');
  return { success: true, count: students.length };
}

export async function getStudentByBarcode(barcode: string): Promise<{ success: boolean; student?: any; error?: string }> {
  await connectDB();

  const student = await Student.findOne({ $or: [{ barcode }, { student_code: barcode }] }).lean({ virtuals: true });
  if (!student) return { success: false, error: 'Student not found' };

  const s = student as any;
  const enrollments = await Enrollment.find({ student_id: s._id })
    .populate('class_id', 'id class_name class_code')
    .lean({ virtuals: true });

  return {
    success: true,
    student: {
      ...s,
      id: s._id.toString(),
      enrollments: (enrollments as any[]).map((e) => ({
        id: e._id.toString(),
        status: e.status,
        classes: { id: e.class_id?._id?.toString(), class_name: e.class_id?.class_name, class_code: e.class_id?.class_code },
      })),
    },
  };
}

export async function searchStudents(query: string, limit = 10): Promise<any[]> {
  await connectDB();

  const regex = new RegExp(query, 'i');
  const students = await Student.find({
    status: 'active',
    $or: [{ barcode: regex }, { student_code: regex }, { full_name: regex }],
  })
    .select('id student_code full_name barcode email status')
    .limit(limit)
    .lean({ virtuals: true });

  return (students as any[]).map((s) => ({ ...s, id: s._id.toString() }));
}
