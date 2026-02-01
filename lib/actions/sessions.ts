'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export interface Session {
    id: string;
    class_id: string;
    name: string;
    start_time: string;
    end_time: string;
    days_of_week: string[];
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface SessionWithClass extends Session {
    classes: {
        id: string;
        class_name: string;
        class_code: string;
    };
}

// Get all sessions
export async function getSessions() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('sessions')
        .select(`
      *,
      classes (
        id,
        class_name,
        class_code
      )
    `)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }

    return data as SessionWithClass[];
}

// Get sessions by class
export async function getSessionsByClass(classId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching sessions:', error);
        return [];
    }

    return data as Session[];
}

// Get single session by ID
export async function getSessionById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('sessions')
        .select(`
      *,
      classes (
        id,
        class_name,
        class_code
      )
    `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching session:', error);
        return null;
    }

    return data as SessionWithClass;
}

// Create session
export async function createSession(formData: FormData) {
    const supabase = await createClient();

    const daysOfWeek = formData.getAll('days_of_week') as string[];

    const sessionData = {
        class_id: formData.get('class_id') as string,
        name: formData.get('name') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        days_of_week: daysOfWeek,
        status: (formData.get('status') as string) || 'active',
    };

    const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

    if (error) {
        console.error('Error creating session:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true, data };
}

// Update session
export async function updateSession(id: string, formData: FormData) {
    const supabase = await createClient();

    const daysOfWeek = formData.getAll('days_of_week') as string[];

    const sessionData = {
        class_id: formData.get('class_id') as string,
        name: formData.get('name') as string,
        start_time: formData.get('start_time') as string,
        end_time: formData.get('end_time') as string,
        days_of_week: daysOfWeek,
        status: formData.get('status') as string || 'active',
    };

    const { data, error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating session:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true, data };
}

// Delete session
export async function deleteSession(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting session:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/sessions');
    revalidatePath('/classes');
    return { success: true };
}
