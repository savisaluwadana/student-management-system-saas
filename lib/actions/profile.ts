'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import { getCurrentUser } from '@/lib/auth/auth';

export async function updateProfile(formData: {
  full_name: string;
  phone?: string;
  avatar_url?: string;
}): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const user = await getCurrentUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  try {
    await User.findByIdAndUpdate(user.id, {
      full_name: formData.full_name,
      phone: formData.phone,
      avatar_url: formData.avatar_url,
    });
    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentProfile() {
  await connectDB();
  const user = await getCurrentUser();

  if (!user) return null;

  const profile = await User.findById(user.id).lean({ virtuals: true });

  if (!profile) {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      avatar_url: '',
      phone: '',
      role: user.role,
    };
  }

  const p = profile as any;
  return {
    id: p._id.toString(),
    full_name: p.full_name,
    email: p.email,
    phone: p.phone || '',
    avatar_url: p.avatar_url || '',
    role: p.role,
  };
}
