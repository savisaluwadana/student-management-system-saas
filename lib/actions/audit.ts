'use server';

import { createClient } from '@/lib/supabase/server';

export interface ActivityLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    description: string;
    metadata?: any;
    ip_address?: string;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
        avatar_url?: string;
    }
}

export async function getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    const supabase = await createClient();

    // Check if admin? Policy says "Admins can manage activity logs".
    // View policy: "Activity logs viewable by admins".
    // If current user is not admin, this might return empty.
    // The user didn't specify who sees it, but normally "Audits" is an admin feature.

    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
      *,
      user:profiles(full_name, email, avatar_url)
    `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching activity logs:', error);
        return [];
    }

    return data || [];
}
