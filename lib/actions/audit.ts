'use server';

import connectDB from '@/lib/mongodb/client';
import ActivityLog from '@/lib/mongodb/models/ActivityLog';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export interface ActivityLogType {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  metadata?: any;
  ip_address?: string;
  created_at: string;
  user?: { full_name: string; email: string; avatar_url?: string };
}

export type ActivityLog = ActivityLogType;

export async function getActivityLogs(limit = 50): Promise<ActivityLogType[]> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });

  const safeLimit = Math.max(1, Math.min(limit, 200));
  const logs = await ActivityLog.find(workspaceFilter(context, {}))
    .sort({ created_at: -1 })
    .limit(safeLimit)
    .populate('user_id', 'full_name email avatar_url')
    .lean({ virtuals: true });

  return (logs as any[]).map((log) => ({
    ...log,
    id: log._id.toString(),
    user: log.user_id
      ? {
          full_name: log.user_id.full_name,
          email: log.user_id.email,
          avatar_url: log.user_id.avatar_url,
        }
      : undefined,
  })) as ActivityLogType[];
}
