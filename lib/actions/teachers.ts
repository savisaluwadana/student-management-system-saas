
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
    classes?: {
        id: string;
        class_name: string;
        class_code: string;
    }[];
};

export async function getTeachers(): Promise<Teacher[]> {
    const supabase = await createClient(); // Use server client (cookies)

    const { data, error } = await supabase
        .from("profiles")
        .select("*, classes(id, class_name, class_code)")
        .eq("role", "teacher")
        .order("full_name");

    if (error) {
        console.error("Error fetching teachers:", error);
        return [];
    }

    return data as Teacher[];
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("*, classes(id, class_name, class_code)")
        .eq("role", "teacher")
        .eq("id", id)
        .single();

    if (error) {
        console.error("Error fetching teacher:", error);
        return null;
    }

    return data as Teacher;
}

export async function createTeacher(data: {
    full_name: string;
    email: string;
    phone?: string;
    class_ids?: string[];
}) {
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

    // 2. Create/Update Profile
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

    // 3. Assign Classes (if any)
    if (data.class_ids && data.class_ids.length > 0) {
        const { error: classError } = await adminClient
            .from("classes")
            .update({ teacher_id: authData.user.id })
            .in("id", data.class_ids);

        if (classError) {
            console.error("Error assigning classes:", classError);
            // Non-blocking error, but good to log
        }
    }

    revalidatePath("/teachers");
    return { success: true };
}

export async function updateTeacher(id: string, data: {
    full_name?: string;
    email?: string; // Changing email requires auth admin update
    phone?: string;
    class_ids?: string[];
}) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !url) {
        return { success: false, error: "Missing Service Role Key" };
    }

    const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
    const adminClient = createSupabaseClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    // 1. Update Profile
    const updateData: any = {};
    if (data.full_name) updateData.full_name = data.full_name;
    if (data.email) updateData.email = data.email;
    if (data.phone) updateData.phone = data.phone;

    const { error: profileError } = await adminClient
        .from("profiles")
        .update(updateData)
        .eq("id", id);

    if (profileError) {
        return { success: false, error: profileError.message };
    }

    // 2. Update Auth Email/Metadata if needed
    if (data.email || data.full_name) {
        const authUpdates: any = {};
        if (data.email) authUpdates.email = data.email;
        if (data.full_name) authUpdates.user_metadata = { full_name: data.full_name };

        const { error: authError } = await adminClient.auth.admin.updateUserById(id, authUpdates);
        if (authError) {
            console.error("Error updating auth user:", authError);
            return { success: false, error: "Profile updated but auth update failed: " + authError.message };
        }
    }

    // 3. Handle Class Assignments
    if (data.class_ids !== undefined) {
        // a. Clear existing assignments for this teacher
        // Actually, we want to clear classes that are NO LONGER in the list.
        // OR simpler: Set teacher_id = NULL for all classes currently owned by this teacher
        // AND THEN set teacher_id = id for the new list.

        // Step 3a: Remove teacher from all classes they currently teach
        // Optimally, we only remove those not in the new list, but clearing all for this teacher first is safer/easier if batching.
        // However, we must be careful not to trigger excessive updates.

        // Let's do it right:
        // 1. Get current classes
        const { data: currentClasses } = await adminClient
            .from("classes")
            .select("id")
            .eq("teacher_id", id);

        const currentIds = currentClasses?.map((c: any) => c.id) || [];
        const newIds = data.class_ids || [];

        const removeIds = currentIds.filter((cid: string) => !newIds.includes(cid));
        const addIds = newIds.filter((cid: string) => !currentIds.includes(cid));

        if (removeIds.length > 0) {
            await adminClient
                .from("classes")
                .update({ teacher_id: null })
                .in("id", removeIds);
        }

        if (addIds.length > 0) {
            await adminClient
                .from("classes")
                .update({ teacher_id: id })
                .in("id", addIds);
        }
    }

    revalidatePath("/teachers");
    return { success: true };
}

export async function deleteTeacher(id: string) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !url) {
        return { success: false, error: "Missing Service Role Key" };
    }

    const { createClient } = require("@supabase/supabase-js");
    const adminClient = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { error } = await adminClient.auth.admin.deleteUser(id);

    if (error) {
        console.error("Error deleting auth user:", error);
        return { success: false, error: error.message };
    }

    revalidatePath("/teachers");
    return { success: true };
}
