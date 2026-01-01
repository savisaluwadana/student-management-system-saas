'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Class, CreateClassInput, UpdateClassInput } from '@/types/class.types';

/**
 * Get all classes with optional filtering
 */
export async function getClasses(status?: string): Promise<Class[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('classes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching classes:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get a single class by ID
 */
export async function getClassById(id: string): Promise<Class | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching class:', error);
    return null;
  }
  
  return data;
}

/**
 * Create a new class
 */
export async function createClass(input: CreateClassInput): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('classes')
    .insert(input)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating class:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/classes');
  return { success: true, id: data.id };
}

/**
 * Update an existing class
 */
export async function updateClass(id: string, input: UpdateClassInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('classes')
    .update(input)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating class:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/classes');
  revalidatePath(`/classes/${id}`);
  return { success: true };
}

/**
 * Delete a class
 */
export async function deleteClass(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting class:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/classes');
  return { success: true };
}

/**
 * Enroll a student in a class
 */
export async function enrollStudent(studentId: string, classId: string, customFee?: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('enrollments')
    .insert({
      student_id: studentId,
      class_id: classId,
      custom_fee: customFee,
      status: 'active'
    });
  
  if (error) {
    console.error('Error enrolling student:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/classes');
  revalidatePath(`/classes/${classId}`);
  revalidatePath('/students');
  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

/**
 * Unenroll a student from a class
 */
export async function unenrollStudent(enrollmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('enrollments')
    .update({ status: 'dropped' })
    .eq('id', enrollmentId);
  
  if (error) {
    console.error('Error unenrolling student:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/classes');
  revalidatePath('/students');
  return { success: true };
}
