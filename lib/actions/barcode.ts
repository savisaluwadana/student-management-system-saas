'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import mongoose from 'mongoose';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

function generateBarcodeValue(studentCode: string) {
  const suffix = Math.floor(100000 + Math.random() * 900000).toString();
  return `${studentCode}-${suffix}`;
}

export async function getStudentsWithoutBarcode() {
  await connectDB();
  const context = await requireWorkspaceContext();
  const students = await Student.find(workspaceFilter(context, {
    $or: [{ barcode: { $exists: false } }, { barcode: null }, { barcode: '' }],
  }))
    .sort({ student_code: 1 })
    .select('student_code full_name barcode')
    .lean({ virtuals: true });

  return (students as any[]).map((student) => ({
    id: student._id.toString(),
    student_code: student.student_code,
    full_name: student.full_name,
    barcode: student.barcode || null,
  }));
}

export async function generateStudentBarcode(studentId: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(studentId)) return { success: false, error: 'Invalid student.' };

  const student = await Student.findOne(workspaceFilter(context, { _id: studentId }));
  if (!student) return { success: false, error: 'Student not found.' };

  for (let attempt = 0; attempt < 10; attempt++) {
    const barcode = generateBarcodeValue(student.student_code);
    const exists = await Student.exists(workspaceFilter(context, { barcode }));
    if (exists) continue;

    student.barcode = barcode;
    await student.save();
    revalidatePath('/students');
    revalidatePath('/students/barcodes');
    return { success: true, barcode };
  }

  return { success: false, error: 'Could not generate a unique barcode. Please try again.' };
}

export async function regenerateStudentBarcode(studentId: string) {
  return generateStudentBarcode(studentId);
}

export async function generateMissingBarcodes() {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  const students = await Student.find(workspaceFilter(context, {
    $or: [{ barcode: { $exists: false } }, { barcode: null }, { barcode: '' }],
  }));

  let updated = 0;
  for (const student of students) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const barcode = generateBarcodeValue(student.student_code);
      const exists = await Student.exists(workspaceFilter(context, { barcode }));
      if (exists) continue;
      student.barcode = barcode;
      await student.save();
      updated += 1;
      break;
    }
  }

  revalidatePath('/students');
  revalidatePath('/students/barcodes');
  return { success: true, count: updated };
}

export async function findStudentByBarcode(barcode: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  const value = barcode.trim();
  if (!value) return null;

  const student = await Student.findOne(workspaceFilter(context, {
    $or: [{ barcode: value }, { student_code: value }],
  })).lean({ virtuals: true });
  if (!student) return null;

  const data = student as any;
  return { ...data, id: data._id.toString() };
}
