'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Generate a unique barcode for a student
 */
export async function generateStudentBarcode(
    studentId: string
): Promise<{ success: boolean; barcode?: string; error?: string }> {
    const supabase = await createClient();

    // Check if student already has a barcode
    const { data: existing, error: fetchError } = await supabase
        .from('students')
        .select('barcode, student_code')
        .eq('id', studentId)
        .single();

    if (fetchError) {
        console.error('Error fetching student:', fetchError);
        return { success: false, error: 'Student not found' };
    }

    if (existing.barcode) {
        return { success: true, barcode: existing.barcode };
    }

    // Generate a unique barcode
    // Format: STU + year + random 6 digits
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const barcode = `STU${year}${random}`;

    // Update student with barcode
    const { error: updateError } = await supabase
        .from('students')
        .update({ barcode })
        .eq('id', studentId);

    if (updateError) {
        console.error('Error updating student barcode:', updateError);
        return { success: false, error: 'Failed to save barcode' };
    }

    revalidatePath('/students');
    revalidatePath(`/students/${studentId}`);

    return { success: true, barcode };
}

/**
 * Bulk generate barcodes for all students without one
 */
export async function generateBulkBarcodes(): Promise<{
    success: boolean;
    count?: number;
    error?: string;
}> {
    const supabase = await createClient();

    // Get students without barcodes
    const { data: students, error: fetchError } = await supabase
        .from('students')
        .select('id, student_code')
        .is('barcode', null);

    if (fetchError) {
        console.error('Error fetching students:', fetchError);
        return { success: false, error: 'Failed to fetch students' };
    }

    if (!students || students.length === 0) {
        return { success: true, count: 0 };
    }

    // Generate barcodes for each student
    const year = new Date().getFullYear().toString().slice(-2);
    const updates = students.map((student, index) => {
        const random = Math.floor(100000 + Math.random() * 900000).toString();
        return {
            id: student.id,
            barcode: `STU${year}${random}`,
        };
    });

    // Update all students
    for (const update of updates) {
        await supabase
            .from('students')
            .update({ barcode: update.barcode })
            .eq('id', update.id);
    }

    revalidatePath('/students');

    return { success: true, count: updates.length };
}

/**
 * Get student by barcode for quick lookup
 */
export async function getStudentByBarcode(barcode: string): Promise<{
    success: boolean;
    student?: any;
    error?: string;
}> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('students')
        .select(`
      *,
      institutes (id, name, code),
      enrollments (
        id,
        status,
        classes (id, class_name, class_code)
      )
    `)
        .or(`barcode.eq.${barcode},student_code.eq.${barcode}`)
        .single();

    if (error || !data) {
        return { success: false, error: 'Student not found' };
    }

    return { success: true, student: data };
}

/**
 * Search students by barcode, code, or name
 */
export async function searchStudents(query: string, limit = 10): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('students')
        .select('id, student_code, full_name, barcode, email, status')
        .or(`barcode.ilike.%${query}%,student_code.ilike.%${query}%,full_name.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(limit);

    if (error) {
        console.error('Error searching students:', error);
        return [];
    }

    return data || [];
}
