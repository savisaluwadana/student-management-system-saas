'use server';

import { createHash, randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import Class from '@/lib/mongodb/models/Class';
import TeamInvite from '@/lib/mongodb/models/TeamInvite';
import mongoose from 'mongoose';
import { checkWorkspaceLimit } from '@/lib/actions/billing';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';
import { writeAuditLog } from '@/lib/saas/audit';

export type Teacher = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'teacher';
  created_at: string;
  classes?: { id: string; class_name: string; class_code: string }[];
};

export type PendingTeacherInvite = {
  id: string;
  email: string;
  expires_at: string;
  created_at: string;
  class_count: number;
};

export async function getTeachers(): Promise<Teacher[]> {
  await connectDB();
  const context = await requireWorkspaceContext();

  const teachers = await User.find(workspaceFilter(context, { role: 'teacher' }))
    .sort({ full_name: 1 })
    .lean({ virtuals: true });

  const result = await Promise.all(
    teachers.map(async (teacher: any) => {
      const classes = await Class.find(workspaceFilter(context, { teacher_id: teacher._id }))
        .select('id class_name class_code')
        .lean({ virtuals: true });
      return {
        ...teacher,
        id: teacher._id.toString(),
        classes: classes.map((classItem: any) => ({
          id: classItem._id.toString(),
          class_name: classItem.class_name,
          class_code: classItem.class_code,
        })),
      };
    })
  );

  return result as unknown as Teacher[];
}

export async function getPendingTeacherInvites(): Promise<PendingTeacherInvite[]> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!context.workspaceObjectId) return [];

  const invites = await TeamInvite.find({
    workspace_id: context.workspaceObjectId,
    role: 'teacher',
    accepted_at: { $exists: false },
    revoked_at: { $exists: false },
    expires_at: { $gt: new Date() },
  }).sort({ created_at: -1 }).lean();

  return (invites as any[]).map((invite) => ({
    id: invite._id.toString(),
    email: invite.email,
    expires_at: new Date(invite.expires_at).toISOString(),
    created_at: new Date(invite.created_at).toISOString(),
    class_count: Array.isArray(invite.class_ids) ? invite.class_ids.length : 0,
  }));
}

export async function getTeacherById(id: string): Promise<Teacher | null> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;

  const teacher = await User.findOne(workspaceFilter(context, { _id: id, role: 'teacher' })).lean({ virtuals: true });
  if (!teacher) return null;

  const data = teacher as any;
  const classes = await Class.find(workspaceFilter(context, { teacher_id: data._id }))
    .select('id class_name class_code')
    .lean({ virtuals: true });

  return {
    ...data,
    id: data._id.toString(),
    classes: classes.map((classItem: any) => ({
      id: classItem._id.toString(),
      class_name: classItem.class_name,
      class_code: classItem.class_code,
    })),
  } as unknown as Teacher;
}

export async function createTeacher(data: {
  full_name: string;
  email: string;
  phone?: string;
  class_ids?: string[];
}): Promise<{ success: boolean; error?: string; invite_url?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });

  try {
    if (!context.workspaceObjectId) {
      return { success: false, error: 'This account must be upgraded to a workspace before inviting team members. Sign out and sign in again to run the safe migration.' };
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return { success: false, error: 'A user with this email already exists.' };

    if (data.class_ids?.length) {
      if (data.class_ids.some((id) => !mongoose.isValidObjectId(id))) {
        return { success: false, error: 'One or more class IDs are invalid.' };
      }
      const classCount = await Class.countDocuments(workspaceFilter(context, { _id: { $in: data.class_ids } }));
      if (classCount !== new Set(data.class_ids).size) {
        return { success: false, error: 'One or more selected classes do not belong to this workspace.' };
      }
    }

    const limit = await checkWorkspaceLimit('teamMembers');
    const pendingInvites = await TeamInvite.countDocuments({
      workspace_id: context.workspaceObjectId,
      accepted_at: { $exists: false },
      revoked_at: { $exists: false },
      expires_at: { $gt: new Date() },
    });
    if (limit.limit !== null && limit.current + pendingInvites >= limit.limit) {
      return { success: false, error: `Your plan allows ${limit.limit} team members, including pending invitations.` };
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await TeamInvite.findOneAndUpdate(
      {
        workspace_id: context.workspaceObjectId,
        email: normalizedEmail,
        role: 'teacher',
        accepted_at: { $exists: false },
        revoked_at: { $exists: false },
      },
      {
        token_hash: tokenHash,
        invited_by: context.user.id,
        class_ids: data.class_ids || [],
        expires_at: expiresAt,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await writeAuditLog(context, {
      action: 'team.invite.created',
      entity_type: 'team_invite',
      entity_id: invite._id.toHexString(),
      description: `Invited ${normalizedEmail} to join as a teacher`,
      metadata: { email: normalizedEmail, class_count: data.class_ids?.length || 0 },
    });

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    revalidatePath('/teachers');
    revalidatePath('/billing');
    revalidatePath('/settings');
    return { success: true, invite_url: `${appUrl}/invite/${token}` };
  } catch (error: any) {
    console.error('Error creating teacher invitation:', error);
    return { success: false, error: error.message };
  }
}

export async function revokeTeacherInvite(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!context.workspaceObjectId || !mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid invitation.' };

  const invite = await TeamInvite.findOneAndUpdate(
    {
      _id: id,
      workspace_id: context.workspaceObjectId,
      accepted_at: { $exists: false },
      revoked_at: { $exists: false },
    },
    { revoked_at: new Date() },
    { new: true }
  );
  if (!invite) return { success: false, error: 'Invitation not found.' };

  await writeAuditLog(context, {
    action: 'team.invite.revoked',
    entity_type: 'team_invite',
    entity_id: invite._id.toHexString(),
    description: `Revoked teacher invitation for ${invite.email}`,
    metadata: { email: invite.email },
  });

  revalidatePath('/teachers');
  revalidatePath('/billing');
  revalidatePath('/settings');
  return { success: true };
}

export async function updateTeacher(
  id: string,
  data: { full_name?: string; email?: string; phone?: string; class_ids?: string[] }
) {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    if (data.class_ids?.length) {
      if (data.class_ids.some((classId) => !mongoose.isValidObjectId(classId))) {
        return { success: false, error: 'One or more class IDs are invalid.' };
      }
      const classCount = await Class.countDocuments(workspaceFilter(context, { _id: { $in: data.class_ids } }));
      if (classCount !== new Set(data.class_ids).size) {
        return { success: false, error: 'One or more selected classes do not belong to this workspace.' };
      }
    }

    const updateData: Record<string, string> = {};
    if (data.full_name) updateData.full_name = data.full_name;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;

    const teacher = await User.findOneAndUpdate(
      workspaceFilter(context, { _id: id, role: 'teacher' }),
      updateData,
      { new: true }
    );
    if (!teacher) return { success: false, error: 'Teacher not found.' };

    if (data.class_ids !== undefined) {
      await Class.updateMany(workspaceFilter(context, { teacher_id: id }), { $unset: { teacher_id: 1 } });
      if (data.class_ids.length > 0) {
        await Class.updateMany(
          workspaceFilter(context, { _id: { $in: data.class_ids } }),
          { teacher_id: teacher._id }
        );
      }
    }

    await writeAuditLog(context, {
      action: 'teacher.updated',
      entity_type: 'teacher',
      entity_id: teacher._id.toHexString(),
      description: `Updated teacher ${teacher.full_name}`,
      metadata: {
        email: teacher.email,
        assigned_classes: data.class_ids?.length,
      },
    });

    revalidatePath('/teachers');
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating teacher:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteTeacher(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const teacher = await User.findOne(workspaceFilter(context, { _id: id, role: 'teacher' }));
    if (!teacher) return { success: false, error: 'Teacher not found.' };

    await Class.updateMany(workspaceFilter(context, { teacher_id: id }), { $unset: { teacher_id: 1 } });
    await User.deleteOne(workspaceFilter(context, { _id: id, role: 'teacher' }));

    await writeAuditLog(context, {
      action: 'teacher.deleted',
      entity_type: 'teacher',
      entity_id: teacher._id.toHexString(),
      description: `Removed teacher ${teacher.full_name}`,
      metadata: { email: teacher.email },
    });

    revalidatePath('/teachers');
    revalidatePath('/billing');
    revalidatePath('/settings');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    return { success: false, error: error.message };
  }
}
