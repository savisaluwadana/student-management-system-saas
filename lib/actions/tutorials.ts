'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export interface Tutorial {
    id: string;
    title: string;
    description?: string;
    content_url?: string;
    content_type?: 'video' | 'document' | 'link' | 'other';
    class_id?: string;
    institute_id?: string;
    is_public: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface TutorialWithRelations extends Tutorial {
    classes?: {
        id: string;
        class_name: string;
    };
    institutes?: {
        id: string;
        name: string;
    };
}

export interface TutorialProgress {
    id: string;
    tutorial_id: string;
    student_id: string;
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    started_at?: string;
    completed_at?: string;
}

export interface TutorialProgressSummary {
    tutorial_id: string;
    title: string;
    class_id?: string;
    class_name?: string;
    total_students: number;
    completed_count: number;
    in_progress_count: number;
    not_started_count: number;
    completion_percentage: number;
}

// Get all tutorials
export async function getTutorials() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tutorials')
        .select(`
      *,
      classes (
        id,
        class_name
      ),
      institutes (
        id,
        name
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tutorials:', error);
        return [];
    }

    return data as TutorialWithRelations[];
}

// Get tutorials by class
export async function getTutorialsByClass(classId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tutorials')
        .select('*')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tutorials:', error);
        return [];
    }

    return data as Tutorial[];
}

// Get single tutorial by ID
export async function getTutorialById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tutorials')
        .select(`
      *,
      classes (
        id,
        class_name
      ),
      institutes (
        id,
        name
      )
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching tutorial:', error);
        return null;
    }

    return data as TutorialWithRelations;
}

// Get tutorial statistics
export async function getTutorialStats() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tutorials')
        .select('id', { count: 'exact' });

    if (error) {
        console.error('Error fetching tutorial stats:', error);
        return { total: 0 };
    }

    return { total: data?.length || 0 };
}

// Create tutorial
export async function createTutorial(formData: FormData) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const classId = formData.get('class_id') as string;
    const instituteId = formData.get('institute_id') as string;

    const tutorialData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        content_url: formData.get('content_url') as string || null,
        content_type: formData.get('content_type') as string || null,
        class_id: (classId && classId !== 'none') ? classId : null,
        institute_id: (instituteId && instituteId !== 'none') ? instituteId : null,
        is_public: formData.get('is_public') === 'true',
        created_by: user?.id || null,
    };

    const { data, error } = await supabase
        .from('tutorials')
        .insert(tutorialData)
        .select()
        .single();

    if (error) {
        console.error('Error creating tutorial:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/tutorials');
    return { success: true, data };
}

// Update tutorial
export async function updateTutorial(id: string, formData: FormData) {
    const supabase = await createClient();

    const classId = formData.get('class_id') as string;
    const instituteId = formData.get('institute_id') as string;

    const tutorialData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        content_url: formData.get('content_url') as string || null,
        content_type: formData.get('content_type') as string || null,
        class_id: (classId && classId !== 'none') ? classId : null,
        institute_id: (instituteId && instituteId !== 'none') ? instituteId : null,
        is_public: formData.get('is_public') === 'true',
    };

    const { data, error } = await supabase
        .from('tutorials')
        .update(tutorialData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating tutorial:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/tutorials');
    return { success: true, data };
}

// Delete tutorial
export async function deleteTutorial(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('tutorials')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting tutorial:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/tutorials');
    return { success: true };
}

// Get tutorial progress for a student
export async function getStudentTutorialProgress(studentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tutorial_progress')
        .select(`
      *,
      tutorials (
        id,
        title,
        content_type
      )
    `)
        .eq('student_id', studentId);

    if (error) {
        console.error('Error fetching tutorial progress:', error);
        return [];
    }

    return data;
}

// Update tutorial progress
export async function updateTutorialProgress(
    tutorialId: string,
    studentId: string,
    status: 'not_started' | 'in_progress' | 'completed',
    progressPercentage?: number
) {
    const supabase = await createClient();

    const progressData: any = {
        tutorial_id: tutorialId,
        student_id: studentId,
        status,
        progress_percentage: progressPercentage || (status === 'completed' ? 100 : 0),
    };

    if (status === 'in_progress' && !progressData.started_at) {
        progressData.started_at = new Date().toISOString();
    }

    if (status === 'completed') {
        progressData.completed_at = new Date().toISOString();
        progressData.progress_percentage = 100;
    }

    const { data, error } = await supabase
        .from('tutorial_progress')
        .upsert(progressData, {
            onConflict: 'tutorial_id,student_id',
        })
        .select()
        .single();

    if (error) {
        console.error('Error updating tutorial progress:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/tutorials');
    return { success: true, data };
}

// Get tutorial progress summary
export async function getTutorialProgressSummary() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('tutorial_progress_summary')
        .select('*');

    if (error) {
        console.error('Error fetching tutorial progress summary:', error);
        return [];
    }

    return data as TutorialProgressSummary[];
}
