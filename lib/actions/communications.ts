'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface Communication {
    id: string;
    recipient_type: 'student' | 'class' | 'all';
    recipient_id: string | null;
    channel: 'email' | 'sms' | 'both';
    subject: string | null;
    message: string;
    status: 'pending' | 'sent' | 'failed' | 'scheduled';
    created_at: string;
    created_by: string | null;
    profiles?: {
        full_name: string;
    };
}

export type CreateCommunicationInput = Omit<Communication, 'id' | 'created_at' | 'updated_at' | 'profiles'>;

export async function getCommunications() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('communications')
        .select(`
      *,
      profiles (
        full_name
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching communications:', error);
        return [];
    }

    return data as Communication[];
}

export async function createCommunication(input: Partial<CreateCommunicationInput>): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Get current user to set created_by
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('communications')
        .insert({
            ...input,
            created_by: user.id,
            status: 'sent', // Auto-mark as sent for now since actual sending logic (SMTP/Twilio) is mocked
            sent_at: new Date().toISOString(),
        });

    if (error) {
        console.error('Error creating communication:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/communications');
    return { success: true };
}
