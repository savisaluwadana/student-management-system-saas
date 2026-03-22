'use server';

import connectDB from '@/lib/mongodb/client';
import ActivityLog from '@/lib/mongodb/models/ActivityLog';

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

// Backward-compatibility alias
export type ActivityLog = ActivityLogType;

export async function getActivityLogs(limit = 50): Promise<ActivityLogType[]> {
  await connectDB();

  const logs = await ActivityLog.find({})
    .sort({ created_at: -1 })
    .limit(limit)
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
