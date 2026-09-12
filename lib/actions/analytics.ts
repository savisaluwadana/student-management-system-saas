'use server';

import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import User from '@/lib/mongodb/models/User';
import Class from '@/lib/mongodb/models/Class';
import TutorialModel from '@/lib/mongodb/models/Tutorial';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Attendance from '@/lib/mongodb/models/Attendance';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalTeachers: number;
  totalTutorials: number;
  activeEnrollments: number;
  attendanceRate: number;
  revenueThisMonth: number;
  pendingPayments: number;
}

export interface TopClass {
  id: string;
  class_name: string;
  class_code: string;
  enrollment_count: number;
  attendance_rate: number;
}

export interface OverduePayment {
  student_id: string;
  student_name: string;
  amount: number;
  due_date: string;
  days_overdue: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalStudents, totalClasses, totalTeachers, totalTutorials, activeEnrollments, attendanceData, revenueData, pendingPayments] =
    await Promise.all([
      Student.countDocuments(workspaceFilter(context, { status: 'active' })),
      Class.countDocuments(workspaceFilter(context, { status: 'active' })),
      User.countDocuments(workspaceFilter(context, { role: 'teacher' })),
      TutorialModel.countDocuments(workspaceFilter(context, {})),
      Enrollment.countDocuments(workspaceFilter(context, { status: 'active' })),
      Attendance.find(workspaceFilter(context, { date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } })).select('status').lean(),
      FeePayment.find(workspaceFilter(context, { status: 'paid', payment_month: { $gte: firstOfMonth.toISOString().split('T')[0] } })).select('amount').lean(),
      FeePayment.countDocuments(workspaceFilter(context, { status: { $in: ['pending', 'overdue', 'unpaid'] } })),
    ]);

  const totalAttendance = (attendanceData as any[]).length;
  const presentCount = (attendanceData as any[]).filter((record) => record.status === 'present' || record.status === 'late').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
  const revenueThisMonth = (revenueData as any[]).reduce((sum, payment) => sum + (payment.amount || 0), 0);

  return { totalStudents, totalClasses, totalTeachers, totalTutorials, activeEnrollments, attendanceRate, revenueThisMonth, pendingPayments };
}

export async function getTopClasses(limit = 5): Promise<TopClass[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const classes = await Class.find(workspaceFilter(context, { status: 'active' }))
    .select('id class_name class_code')
    .lean({ virtuals: true });

  const classStats = await Promise.all(
    (classes as any[]).map(async (classItem) => {
      const [enrollmentCount, attendance] = await Promise.all([
        Enrollment.countDocuments(workspaceFilter(context, { class_id: classItem._id, status: 'active' })),
        Attendance.find(workspaceFilter(context, {
          class_id: classItem._id,
          date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] },
        })).select('status').lean(),
      ]);
      const total = (attendance as any[]).length;
      const present = (attendance as any[]).filter((record) => record.status === 'present' || record.status === 'late').length;
      return {
        id: classItem._id.toString(),
        class_name: classItem.class_name,
        class_code: classItem.class_code,
        enrollment_count: enrollmentCount,
        attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    })
  );

  return classStats.sort((a, b) => b.enrollment_count - a.enrollment_count).slice(0, Math.max(1, Math.min(limit, 25)));
}

export async function getOverduePayments(): Promise<{ payments: OverduePayment[]; total: number }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const today = new Date().toISOString().split('T')[0];

  const data = await FeePayment.find(workspaceFilter(context, {
    status: { $in: ['pending', 'overdue'] },
    due_date: { $lt: today },
  }))
    .sort({ due_date: 1 })
    .populate('student_id', 'full_name')
    .lean({ virtuals: true });

  const payments = (data as any[]).map((payment) => ({
    student_id: payment.student_id?._id?.toString(),
    student_name: payment.student_id?.full_name || 'Unknown',
    amount: payment.amount,
    due_date: payment.due_date,
    days_overdue: Math.max(0, Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))),
  }));

  return { payments, total: payments.reduce((sum, payment) => sum + payment.amount, 0) };
}
