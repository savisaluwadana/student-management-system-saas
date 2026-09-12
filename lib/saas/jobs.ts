import connectDB from '@/lib/mongodb/client';
import Workspace from '@/lib/mongodb/models/Workspace';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import FeePayment from '@/lib/mongodb/models/FeePayment';

async function billableWorkspaceIds() {
  const workspaces = await Workspace.find({
    status: 'active',
    subscription_status: { $in: ['trialing', 'active', 'past_due'] },
  }).select('_id').lean();
  return (workspaces as any[]).map((workspace) => workspace._id);
}

export async function runFeeGeneration(targetMonth: Date) {
  await connectDB();

  const workspaceIds = await billableWorkspaceIds();
  const targetDate = targetMonth.toISOString().split('T')[0];
  const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1).toISOString().split('T')[0];
  const monthlyDueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 5).toISOString().split('T')[0];

  const enrollments = await Enrollment.find({
    status: 'active',
    $or: [
      { workspace_id: { $in: workspaceIds } },
      { workspace_id: { $exists: false } },
    ],
  })
    .populate('class_id', 'fee_amount fee_collection_type workspace_id')
    .lean({ virtuals: true });

  let created = 0;
  let skipped = 0;

  for (const enrollment of enrollments as any[]) {
    const classData = enrollment.class_id;
    if (!classData?.fee_amount) {
      skipped += 1;
      continue;
    }

    const enrollmentWorkspace = enrollment.workspace_id?.toString();
    const classWorkspace = classData.workspace_id?.toString();
    if (enrollmentWorkspace && classWorkspace && enrollmentWorkspace !== classWorkspace) {
      skipped += 1;
      continue;
    }

    const collectionType = classData.fee_collection_type || 'monthly';
    const paymentPeriod = collectionType === 'daily' ? targetDate : monthStart;
    const dueDate = collectionType === 'daily' ? targetDate : monthlyDueDate;
    const filter: Record<string, unknown> = {
      student_id: enrollment.student_id,
      class_id: classData._id,
      payment_month: paymentPeriod,
    };
    if (enrollment.workspace_id) filter.workspace_id = enrollment.workspace_id;
    else filter.workspace_id = { $exists: false };

    const exists = await FeePayment.exists(filter);
    if (exists) {
      skipped += 1;
      continue;
    }

    await FeePayment.create({
      workspace_id: enrollment.workspace_id,
      student_id: enrollment.student_id,
      class_id: classData._id,
      amount: enrollment.custom_fee || classData.fee_amount,
      fee_collection_type: collectionType,
      status: 'pending',
      payment_month: paymentPeriod,
      due_date: dueDate,
    });
    created += 1;
  }

  return { created, skipped, processed: enrollments.length };
}

export async function runMarkOverduePayments() {
  await connectDB();
  const workspaceIds = await billableWorkspaceIds();
  const today = new Date().toISOString().split('T')[0];

  const result = await FeePayment.updateMany(
    {
      status: 'pending',
      due_date: { $lt: today },
      $or: [
        { workspace_id: { $in: workspaceIds } },
        { workspace_id: { $exists: false } },
      ],
    },
    { status: 'overdue' }
  );

  return { updated: result.modifiedCount };
}
