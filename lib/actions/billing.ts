'use server';

import connectDB from '@/lib/mongodb/client';
import Workspace from '@/lib/mongodb/models/Workspace';
import Student from '@/lib/mongodb/models/Student';
import User from '@/lib/mongodb/models/User';
import Institute from '@/lib/mongodb/models/Institute';
import { getPlanDefinition, usagePercent } from '@/lib/saas/plans';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export interface BillingSummary {
  workspace: {
    id: string | null;
    name: string;
    plan: 'starter' | 'professional' | 'scale';
    subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'legacy';
    trial_ends_at: string | null;
    current_period_end: string | null;
    currency: string;
  };
  plan: ReturnType<typeof getPlanDefinition>;
  usage: {
    students: { current: number; limit: number | null; percent: number };
    teamMembers: { current: number; limit: number | null; percent: number };
    branches: { current: number; limit: number | null; percent: number };
  };
}

export async function getBillingSummary(): Promise<BillingSummary> {
  await connectDB();
  const context = await requireWorkspaceContext({ admin: true });

  const [workspaceDoc, students, teamMembers, branches] = await Promise.all([
    context.workspaceObjectId ? Workspace.findById(context.workspaceObjectId).lean() : Promise.resolve(null),
    Student.countDocuments(workspaceFilter(context, { status: 'active' })),
    User.countDocuments(workspaceFilter(context, {})),
    Institute.countDocuments(workspaceFilter(context, { status: 'active' })),
  ]);

  const workspace = workspaceDoc as any;
  const planId = (workspace?.plan || 'professional') as 'starter' | 'professional' | 'scale';
  const plan = getPlanDefinition(planId);

  return {
    workspace: {
      id: workspace?._id?.toString() || null,
      name: workspace?.name || 'Legacy workspace',
      plan: planId,
      subscription_status: workspace?.subscription_status || 'legacy',
      trial_ends_at: workspace?.trial_ends_at ? new Date(workspace.trial_ends_at).toISOString() : null,
      current_period_end: workspace?.current_period_end ? new Date(workspace.current_period_end).toISOString() : null,
      currency: workspace?.currency || 'LKR',
    },
    plan,
    usage: {
      students: {
        current: students,
        limit: plan.studentLimit,
        percent: usagePercent(students, plan.studentLimit),
      },
      teamMembers: {
        current: teamMembers,
        limit: plan.teamMemberLimit,
        percent: usagePercent(teamMembers, plan.teamMemberLimit),
      },
      branches: {
        current: branches,
        limit: plan.branchLimit,
        percent: usagePercent(branches, plan.branchLimit),
      },
    },
  };
}

export async function checkWorkspaceLimit(resource: 'students' | 'teamMembers' | 'branches') {
  const summary = await getBillingSummary();
  const usage = summary.usage[resource];

  if (usage.limit === null) return { allowed: true, limit: null, current: usage.current };

  return {
    allowed: usage.current < usage.limit,
    limit: usage.limit,
    current: usage.current,
    error: usage.current >= usage.limit
      ? `Your ${summary.plan.name} plan limit of ${usage.limit} ${resource === 'teamMembers' ? 'team members' : resource} has been reached.`
      : undefined,
  };
}
