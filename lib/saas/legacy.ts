import { randomBytes } from 'crypto';
import User, { type IUser } from '@/lib/mongodb/models/User';
import Workspace from '@/lib/mongodb/models/Workspace';
import Institute from '@/lib/mongodb/models/Institute';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import Attendance from '@/lib/mongodb/models/Attendance';
import Tutorial from '@/lib/mongodb/models/Tutorial';
import TutorialProgress from '@/lib/mongodb/models/TutorialProgress';
import ActivityLog from '@/lib/mongodb/models/ActivityLog';

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';
  return `${base}-${randomBytes(3).toString('hex')}`;
}

/**
 * Upgrades the original single-tenant installation in place when ownership is
 * unambiguous. If multiple legacy admins exist we deliberately do nothing so
 * data is never silently assigned to the wrong account.
 */
export async function migrateLegacyWorkspaceForAdmin(user: IUser) {
  if (user.workspace_id) return user.workspace_id;
  if (user.role !== 'admin') return null;

  const legacyAdminCount = await User.countDocuments({ role: 'admin', workspace_id: { $exists: false } });
  if (legacyAdminCount !== 1) return null;

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  const workspace = await Workspace.create({
    name: `${user.full_name}'s Institute`,
    slug: slugify(user.full_name),
    owner_user_id: user._id,
    plan: 'professional',
    subscription_status: 'trialing',
    trial_ends_at: trialEndsAt,
    billing_email: user.email,
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    status: 'active',
  });

  const scope = { workspace_id: { $exists: false } };
  await Promise.all([
    User.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    Institute.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    Student.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    Class.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    Enrollment.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    FeePayment.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    Attendance.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    Tutorial.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    TutorialProgress.updateMany(scope, { $set: { workspace_id: workspace._id } }),
    ActivityLog.updateMany(scope, { $set: { workspace_id: workspace._id } }),
  ]);

  const branchCount = await Institute.countDocuments({ workspace_id: workspace._id });
  if (branchCount === 0) {
    await Institute.create({
      workspace_id: workspace._id,
      code: `MAIN-${randomBytes(3).toString('hex').toUpperCase()}`,
      name: 'Main Branch',
      email: user.email,
      status: 'active',
    });
  }

  user.workspace_id = workspace._id;
  return workspace._id;
}
