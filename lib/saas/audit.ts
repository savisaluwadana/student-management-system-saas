import ActivityLog from '@/lib/mongodb/models/ActivityLog';
import { workspaceValue, type WorkspaceContext } from '@/lib/saas/workspace';

export async function writeAuditLog(
  context: WorkspaceContext,
  entry: {
    action: string;
    entity_type: string;
    entity_id?: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await ActivityLog.create({
      workspace_id: workspaceValue(context),
      user_id: context.user.id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      description: entry.description,
      metadata: entry.metadata,
    });
  } catch (error) {
    // Audit logging must not make the primary mutation fail.
    console.error('Audit log write failed:', error);
  }
}
