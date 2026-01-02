'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: {
    full_name: string;
    phone?: string;
    avatar_url?: string;
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: formData.full_name,
            phone: formData.phone,
            avatar_url: formData.avatar_url,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

    if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function getCurrentProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) return null;

    return {
        ...data,
        email: user.email,
        role: user.role || 'user'
    };
}
