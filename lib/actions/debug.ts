'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fixPermissions(targetEmail?: string) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !url) {
        return { success: false, error: "Missing Service Role Key or URL" };
    }

    // Create admin client with service role for bypassing RLS
    const adminClient = createClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        let userId = '';

        if (targetEmail) {
            // If email provided, look up the user
            // admin.listUsers() is required to find by email if we don't have the ID
            // But listUsers might be slow if many users. simpler to search profiles if they exist.
            // But profiles might be protected by RLS (which we are bypassing).

            // Best way: use adminClient.auth.admin.listUsers() filtering by email
            const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
                page: 1,
                perPage: 1
            });
            // Supabase listUsers doesn't strictly support filtering by email in the params object directly in all versions, 
            // but let's try getting the user or assuming the caller is the user if no email.

            // Actually, the simplest way if we know the ID is better.
            // If we want to upgrade the CURRENT user:
        }

        let targetId = '';

        if (targetEmail) {
            // Fetch user by email not directly supported easily without listing. 
            // Let's assume we are fixing the CURRENT user for now as that's the primary use case.
            // Or allow fixing by ID if passed.
            return { success: false, error: "Targeting by email not yet implemented safely." };
        } else {
            const supabase = await createServerClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { success: false, error: "Not authenticated" };
            targetId = user.id;
        }

        console.log(`[FixPermissions] Updating role for user ${targetId} to 'admin'...`);

        // 1. Update public profile
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', targetId);

        if (profileError) {
            console.error("[FixPermissions] Error updating profile:", profileError);
            return { success: false, error: `Profile update failed: ${profileError.message}` };
        }

        // 2. Update auth.users metadata (for JWT claims if used)
        const { error: authError } = await adminClient.auth.admin.updateUserById(targetId, {
            user_metadata: { role: 'admin' }
        });

        if (authError) {
            console.error("[FixPermissions] Error updating auth metadata:", authError);
            // We continue even if this fails, as profile is the source of truth for RLS usually
        }

        console.log("[FixPermissions] Success!");
        revalidatePath('/', 'layout');
        return { success: true };

    } catch (error: any) {
        console.error("[FixPermissions] Unexpected error:", error);
        return { success: false, error: error.message };
    }
}
