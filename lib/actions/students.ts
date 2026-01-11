'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Student, CreateStudentInput, UpdateStudentInput } from '@/types/student.types';

/**
 * Get all students with optional filtering
 */
export async function getStudents(status?: string): Promise<Student[]> {
  const supabase = await createClient();

  let query = supabase
    .from('students')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single student by ID
 */
export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching student:', error);
    return null;
  }

  return data;
}

/**
 * Create a new student
 */
export async function createStudent(input: CreateStudentInput): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('students')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
    return { success: false, error: error.message };
  }

  // Handle class enrollments if class_ids are provided
  if (input.class_ids && input.class_ids.length > 0) {
    const enrollments = input.class_ids.map(classId => ({
      student_id: data.id,
      class_id: classId,
      status: 'active'
    }));

    const { error: enrollmentError } = await supabase
      .from('enrollments')
      .insert(enrollments);

    if (enrollmentError) {
      console.error('Error creating enrollments:', enrollmentError);
      // We don't fail the whole request but we should log it
      // Ideally we would return a warning
    }
  }

  revalidatePath('/students');
  return { success: true, id: data.id };
}

/**
 * Update an existing student
 */
export async function updateStudent(id: string, input: UpdateStudentInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Separate class_ids from other student data
  const { class_ids, ...studentData } = input;

  const { error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', id);

  if (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }

  // Handle class enrollments if class_ids is provided (even if empty, it means clear enrollments)
  if (class_ids !== undefined) {
    // 1. Get current enrollments
    const { data: currentEnrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('student_id', id);

    const currentClassIds = currentEnrollments?.map(e => e.class_id) || [];

    // 2. Identify classes to add and remove
    const classesToAdd = class_ids.filter(cid => !currentClassIds.includes(cid));
    const classesToRemove = currentClassIds.filter(cid => !class_ids.includes(cid));

    // 3. Add new enrollments
    if (classesToAdd.length > 0) {
      const newEnrollments = classesToAdd.map(classId => ({
        student_id: id,
        class_id: classId,
        status: 'active'
      }));
      await supabase.from('enrollments').insert(newEnrollments);
    }

    // 4. Remove old enrollments (or mark as dropped/inactive? Requirement implies "included to a class", so removing usually means delete or drop. Let's delete for now to keep it clean, or update status if we want history. Let's delete per standard CRUD expectation unless "status" is strictly managed.)
    // However, the schema has an 'enrollments' table with status. Let's delete for simplicity as this is a "manage classes" interface, or check if we should set to 'dropped'.
    // Given the prompt "students should be able to be included to a class", removal might imply just strictly removing. Let's use delete for cleanup or update status if we want to preserve history. 
    // Schema has `status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'dropped'))`.
    // Let's delete to ensure the "Enrollment" state reflects the checkboxes exactly.
    if (classesToRemove.length > 0) {
      await supabase
        .from('enrollments')
        .delete()
        .eq('student_id', id)
        .in('class_id', classesToRemove);
    }
  }

  revalidatePath('/students');
  revalidatePath(`/students/${id}`);
  return { success: true };
}

/**
 * Delete a student
 */
export async function deleteStudent(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/students');
  return { success: true };
}

/**
 * Get student payment summary
 */
export async function getStudentPaymentSummary(studentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('student_payment_summary')
    .select('*')
    .eq('student_id', studentId)
    .single();

  if (error) {
    console.error('Error fetching payment summary:', error);
    return null;
  }

  return data;
}

/**
 * Bulk create students from CSV import
 */
export async function bulkCreateStudents(
  students: CreateStudentInput[]
): Promise<{ success: boolean; imported?: number; failed?: number; errors?: string[] }> {
  const supabase = await createClient();

  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('students')
      .insert(batch)
      .select();

    if (error) {
      errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      failed += batch.length;
    } else {
      imported += data?.length || 0;
    }
  }

  revalidatePath('/students');

  return {
    success: errors.length === 0,
    imported,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get all students for export
 */
export async function getAllStudentsForExport(): Promise<Student[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('student_code', { ascending: true });

  if (error) {
    console.error('Error fetching students for export:', error);
    return [];
  }

  return data || [];
}

