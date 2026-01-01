'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
    Assessment,
    AssessmentWithClass,
    CreateAssessmentInput,
    UpdateAssessmentInput,
    Grade,
    GradeWithStudent,
    BulkGradeInput,
    ClassAssessmentSummary,
    StudentForGrading,
} from '@/types/assessment.types';

/**
 * Get all assessments with optional class filtering
 */
export async function getAssessments(classId?: string): Promise<AssessmentWithClass[]> {
    const supabase = await createClient();

    let query = supabase
        .from('assessments')
        .select(`
      *,
      classes(id, class_code, class_name, subject)
    `)
        .order('date', { ascending: false });

    if (classId) {
        query = query.eq('class_id', classId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching assessments:', error);
        return [];
    }

    return data || [];
}

/**
 * Get a single assessment by ID
 */
export async function getAssessmentById(id: string): Promise<AssessmentWithClass | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('assessments')
        .select(`
      *,
      classes(id, class_code, class_name, subject)
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching assessment:', error);
        return null;
    }

    return data;
}

/**
 * Create a new assessment
 */
export async function createAssessment(
    input: CreateAssessmentInput
): Promise<{ success: boolean; error?: string; id?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('assessments')
        .insert({
            ...input,
            created_by: user?.id,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating assessment:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/assessments');
    return { success: true, id: data.id };
}

/**
 * Update an assessment
 */
export async function updateAssessment(
    id: string,
    input: UpdateAssessmentInput
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('assessments')
        .update(input)
        .eq('id', id);

    if (error) {
        console.error('Error updating assessment:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${id}`);
    return { success: true };
}

/**
 * Delete an assessment
 */
export async function deleteAssessment(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting assessment:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/assessments');
    return { success: true };
}

/**
 * Get students for grading an assessment
 */
export async function getStudentsForGrading(
    assessmentId: string
): Promise<StudentForGrading[]> {
    const supabase = await createClient();

    // First get the assessment to get class_id
    const { data: assessment } = await supabase
        .from('assessments')
        .select('class_id')
        .eq('id', assessmentId)
        .single();

    if (!assessment) {
        return [];
    }

    // Get enrolled students with existing grades
    const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
      student_id,
      students(id, student_code, full_name)
    `)
        .eq('class_id', assessment.class_id)
        .eq('status', 'active');

    if (enrollmentError) {
        console.error('Error fetching enrolled students:', enrollmentError);
        return [];
    }

    // Get existing grades
    const { data: existingGrades } = await supabase
        .from('grades')
        .select('student_id, score, remarks')
        .eq('assessment_id', assessmentId);

    const gradesMap = new Map(
        (existingGrades || []).map((g) => [g.student_id, g])
    );

    return (enrollments || []).map((e: any) => ({
        student_id: e.students.id,
        student_code: e.students.student_code,
        full_name: e.students.full_name,
        current_score: gradesMap.get(e.student_id)?.score,
        current_remarks: gradesMap.get(e.student_id)?.remarks,
    }));
}

/**
 * Save grades for an assessment (bulk upsert)
 */
export async function saveGrades(
    input: BulkGradeInput
): Promise<{ success: boolean; error?: string; count?: number }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Filter out grades with null scores (unless they have remarks)
    const validGrades = input.grades.filter(g => g.score !== null || g.remarks);

    if (validGrades.length === 0) {
        return { success: true, count: 0 };
    }

    const gradeRecords = validGrades.map((g) => ({
        assessment_id: input.assessment_id,
        student_id: g.student_id,
        score: g.score,
        remarks: g.remarks || null,
        graded_by: user?.id,
        graded_at: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from('grades')
        .upsert(gradeRecords, { onConflict: 'assessment_id,student_id' });

    if (error) {
        console.error('Error saving grades:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${input.assessment_id}`);
    return { success: true, count: validGrades.length };
}

/**
 * Get grades for an assessment
 */
export async function getGradesForAssessment(
    assessmentId: string
): Promise<GradeWithStudent[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('grades')
        .select(`
      *,
      students(id, student_code, full_name)
    `)
        .eq('assessment_id', assessmentId);

    if (error) {
        console.error('Error fetching grades:', error);
        return [];
    }

    return data || [];
}

/**
 * Get class assessment summary
 */
export async function getClassAssessmentSummary(
    classId: string
): Promise<ClassAssessmentSummary[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('class_assessment_summary')
        .select('*')
        .eq('class_id', classId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching class assessment summary:', error);
        return [];
    }

    return data || [];
}

/**
 * Get student report card (grades across all classes)
 */
export async function getStudentReportCard(studentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('student_class_grades')
        .select('*')
        .eq('student_id', studentId)
        .order('class_name')
        .order('assessment_date');

    if (error) {
        console.error('Error fetching student report card:', error);
        return [];
    }

    return data || [];
}
