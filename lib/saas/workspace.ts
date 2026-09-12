import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import Workspace from '@/lib/mongodb/models/Workspace';
import { getCurrentUser, type JWTPayload } from '@/lib/auth/auth';

export interface WorkspaceContext {
  user: JWTPayload;
  workspaceId: string | null;
  workspaceObjectId: mongoose.Types.ObjectId | null;
  legacy: boolean;
}

/**
 * Resolve request identity against the database, not only the JWT snapshot.
 * This makes deleted users, role changes, password resets and suspended
 * workspaces take effect immediately instead of waiting for token expiry.
 */
export async function requireWorkspaceContext(options?: { admin?: boolean }): Promise<WorkspaceContext> {
  const session = await getCurrentUser();
  if (!session || !mongoose.isValidObjectId(session.id)) throw new Error('Unauthorized');

  await connectDB();
  const dbUser = await User.findById(session.id)
    .select('email full_name role workspace_id auth_version')
    .lean();

  if (!dbUser) throw new Error('Unauthorized');

  const userData = dbUser as any;
  const liveAuthVersion = Number(userData.auth_version || 0);
  const sessionAuthVersion = Number(session.auth_version || 0);
  if (sessionAuthVersion !== liveAuthVersion) throw new Error('Unauthorized');

  if (options?.admin && userData.role !== 'admin') throw new Error('Forbidden');

  const workspaceId = userData.workspace_id?.toString() || null;
  if (workspaceId && !mongoose.isValidObjectId(workspaceId)) {
    throw new Error('Invalid workspace');
  }

  if (workspaceId) {
    const workspaceExists = await Workspace.exists({
      _id: workspaceId,
      status: 'active',
    });
    if (!workspaceExists) throw new Error('Workspace unavailable');
  }

  const user: JWTPayload = {
    id: userData._id.toString(),
    email: userData.email,
    role: userData.role,
    full_name: userData.full_name,
    workspace_id: workspaceId,
    auth_version: liveAuthVersion,
  };

  return {
    user,
    workspaceId,
    workspaceObjectId: workspaceId ? new mongoose.Types.ObjectId(workspaceId) : null,
    legacy: !workspaceId,
  };
}

export function workspaceFilter(
  context: Pick<WorkspaceContext, 'workspaceObjectId'>,
  filter: Record<string, unknown> = {}
): Record<string, unknown> {
  return context.workspaceObjectId
    ? { ...filter, workspace_id: context.workspaceObjectId }
    : { ...filter, workspace_id: { $exists: false } };
}

export function workspaceValue(context: Pick<WorkspaceContext, 'workspaceObjectId'>) {
  return context.workspaceObjectId || undefined;
}

export function workspaceMatches(
  context: Pick<WorkspaceContext, 'workspaceId'>,
  value?: mongoose.Types.ObjectId | string | null
): boolean {
  if (!context.workspaceId) return !value;
  return Boolean(value) && value!.toString() === context.workspaceId;
}
