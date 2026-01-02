'use server';

import { createClient } from '@supabase/supabase-js'; // Use admin client directly
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fixPermissions() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !url) {
        return { success: false, error: "Missing Service Role Key" };
    }

    const adminClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Update profile to admin
    const { error } = await adminClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id);

    if (error) {
        console.error("Error fixing permissions:", error);
        return { success: false, error: error.message };
    }

    // Also update metadata?
    await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: { role: 'admin' }
    });

    revalidatePath('/', 'layout');
    return { success: true };
}
