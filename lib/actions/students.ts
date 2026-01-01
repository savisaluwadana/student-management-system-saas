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

  revalidatePath('/students');
  return { success: true, id: data.id };
}

/**
 * Update an existing student
 */
export async function updateStudent(id: string, input: UpdateStudentInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('students')
    .update(input)
    .eq('id', id);

  if (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
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

