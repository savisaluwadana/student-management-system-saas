import mongoose from 'mongoose';
import { getCurrentUser, type JWTPayload } from '@/lib/auth/auth';

export interface WorkspaceContext {
  user: JWTPayload;
  workspaceId: string | null;
  workspaceObjectId: mongoose.Types.ObjectId | null;
  legacy: boolean;
}

export async function requireWorkspaceContext(options?: { admin?: boolean }): Promise<WorkspaceContext> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  if (options?.admin && user.role !== 'admin') throw new Error('Forbidden');

  const workspaceId = user.workspace_id || null;
  if (workspaceId && !mongoose.isValidObjectId(workspaceId)) {
    throw new Error('Invalid workspace');
  }

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
