
/**
 * Server Actions for Teacher Management
 */
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Teacher = {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    role: "teacher";
    created_at: string;
};

export async function getTeachers(): Promise<Teacher[]> {
    const supabase = await createClient(); // Use server client (cookies)

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")
        .order("full_name");

    if (error) {
        console.error("Error fetching teachers:", error);
        return [];
    }

    return data as Teacher[];
}

export async function createTeacher(data: {
    full_name: string;
    email: string;
    phone?: string;
}) {
    const supabase = await createClient();

    // NOTE: In a real app, we must create a Supabase Auth User first.
    // Since we are using the 'authenticated' client here (cookie based), 
    // we CANNOT create a new user unless we use the Admin Client.
    // For this demo, we will try to insert into profiles directly, 
    // BUT this will likely fail due to foreign key constraint on auth.users(id).

    // OPTION: We use a Service Role client to create the user.
    // I will assume for now we just want to Stub this or use a separate function provided we have the key.

    // For now, I will return an error explaining this limitation if not set up, 
    // OR I will attempt to use a direct SQL call via RPC if available.

    // Let's implement the Admin Client approach if possible.
    // But defining it inline to avoid file sprawl for now.

    // For the sake of this task, let's assume we can't create new USERS easily without the user logging in themselves.
    // A common pattern is "Invite User" via Supabase `inviteUserByEmail`.

    // Let's TRY to use the service role key if it exists in process.env
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !url) {
        return { success: false, error: "Server configuration error: Missing Service Role Key." };
    }

    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const adminClient = createSupabaseClient(url, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    // 1. Create Auth User
    // Password will be random or set to a default
    const tempPassword = "TempPassword123!";
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: data.full_name, role: 'teacher' }
    });

    if (authError) {
        return { success: false, error: authError.message };
    }

    if (!authData.user) {
        return { success: false, error: "Failed to create user." };
    }

    // 2. Create Profile (Trigger usually handles this, but let's update it or ensure it exists)
    // Our schema has triggers? "update_profiles_updated_at".
    // Usually Supabase has a trigger on auth.users -> public.profiles.
    // If not, we insert manually.

    // Let's attempt to update the profile that might have been auto-created, or insert it.
    // We'll wait a brief moment or just upsert.

    // Note: If trigger exists, it copies metadata.
    // If not, we insert.

    const { error: profileError } = await adminClient
        .from("profiles")
        .upsert({
            id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            role: "teacher",
            phone: data.phone
        });

    if (profileError) {
        return { success: false, error: "User created but profile failed: " + profileError.message };
    }

    revalidatePath("/teachers");
    return { success: true };
}
