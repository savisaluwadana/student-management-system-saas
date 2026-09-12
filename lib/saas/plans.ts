import type { WorkspacePlan } from '@/lib/mongodb/models/Workspace';

export interface PlanDefinition {
  id: WorkspacePlan;
  name: string;
  monthlyPriceLkr: number | null;
  studentLimit: number | null;
  teamMemberLimit: number | null;
  branchLimit: number | null;
  features: string[];
}

export const SAAS_PLANS: Record<WorkspacePlan, PlanDefinition> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPriceLkr: 5900,
    studentLimit: 50,
    teamMemberLimit: 3,
    branchLimit: 1,
    features: ['Student management', 'Attendance', 'Payments', 'Basic reports'],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    monthlyPriceLkr: 14900,
    studentLimit: 500,
    teamMemberLimit: 20,
    branchLimit: 10,
    features: [
      'Everything in Starter',
      'Assessments and report cards',
      'Email, SMS and WhatsApp workflows',
      'Multi-branch management',
      'Advanced reports',
    ],
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    monthlyPriceLkr: null,
    studentLimit: null,
    teamMemberLimit: null,
    branchLimit: null,
    features: ['Everything in Professional', 'Unlimited scale', 'SSO', 'SLA', 'Priority support'],
  },
};

export function getPlanDefinition(plan?: WorkspacePlan | null): PlanDefinition {
  return SAAS_PLANS[plan || 'professional'] || SAAS_PLANS.professional;
}

export function usagePercent(current: number, limit: number | null): number {
  if (!limit) return 0;
  return Math.min(100, Math.round((current / limit) * 100));
}
