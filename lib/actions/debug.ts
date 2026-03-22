'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import { getCurrentUser } from '@/lib/auth/auth';

/**
 * Fix permissions - upgrade current user to admin role
 * (Replaces the Supabase admin SDK / RLS fix utility)
 */
export async function fixPermissions(targetEmail?: string) {
  await connectDB();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    let targetId = currentUser.id;

    if (targetEmail) {
      const target = await User.findOne({ email: targetEmail.toLowerCase() }).select('_id').lean();
      if (!target) return { success: false, error: 'User not found with that email' };
      targetId = (target as any)._id.toString();
    }

    console.log(`[FixPermissions] Updating role for user ${targetId} to 'admin'...`);

    await User.findByIdAndUpdate(targetId, { role: 'admin' });

    console.log('[FixPermissions] Success!');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('[FixPermissions] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}
