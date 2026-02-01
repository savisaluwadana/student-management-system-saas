'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Types
export interface Institute {
    id: string;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface InstituteSummary extends Institute {
    total_students: number;
    total_classes: number;
}

// Get all institutes
export async function getInstitutes() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('institutes')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching institutes:', error);
        return [];
    }

    return data as Institute[];
}

// Get institute summary with counts
export async function getInstituteSummaries() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('institute_summary')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching institute summaries:', error);
        return [];
    }

    return data as InstituteSummary[];
}

// Get single institute by ID
export async function getInstituteById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('institutes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching institute:', error);
        return null;
    }

    return data as Institute;
}

// Create institute
export async function createInstitute(formData: FormData) {
    const supabase = await createClient();

    const instituteData = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        address: formData.get('address') as string || null,
        phone: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        status: (formData.get('status') as string) || 'active',
    };

    const { data, error } = await supabase
        .from('institutes')
        .insert(instituteData)
        .select()
        .single();

    if (error) {
        console.error('Error creating institute:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/institutes');
    return { success: true, data };
}

// Update institute
export async function updateInstitute(id: string, formData: FormData) {
    const supabase = await createClient();

    const instituteData = {
        code: formData.get('code') as string,
        name: formData.get('name') as string,
        address: formData.get('address') as string || null,
        phone: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        status: formData.get('status') as string || 'active',
    };

    const { data, error } = await supabase
        .from('institutes')
        .update(instituteData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating institute:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/institutes');
    return { success: true, data };
}

// Delete institute
export async function deleteInstitute(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('institutes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting institute:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/institutes');
    return { success: true };
}
