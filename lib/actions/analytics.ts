'use server';

import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import User from '@/lib/mongodb/models/User';
import Class from '@/lib/mongodb/models/Class';
import TutorialModel from '@/lib/mongodb/models/Tutorial';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Attendance from '@/lib/mongodb/models/Attendance';
import FeePayment from '@/lib/mongodb/models/FeePayment';

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
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalStudents, totalClasses, totalTeachers, totalTutorials, activeEnrollments, attendanceData, revenueData, pendingPayments] =
    await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Class.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'teacher' }),
      TutorialModel.countDocuments(),
      Enrollment.countDocuments({ status: 'active' }),
      Attendance.find({ date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } }).select('status').lean(),
      FeePayment.find({ status: 'paid', payment_month: { $gte: firstOfMonth.toISOString().split('T')[0] } }).select('amount').lean(),
      FeePayment.countDocuments({ status: 'pending' }),
    ]);

  const totalAtt = (attendanceData as any[]).length;
  const presentCount = (attendanceData as any[]).filter((r) => r.status === 'present' || r.status === 'late').length;
  const attendanceRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 0;
  const revenueThisMonth = (revenueData as any[]).reduce((sum, t) => sum + (t.amount || 0), 0);

  return { totalStudents, totalClasses, totalTeachers, totalTutorials, activeEnrollments, attendanceRate, revenueThisMonth, pendingPayments };
}

export async function getTopClasses(limit = 5): Promise<TopClass[]> {
  await connectDB();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const classes = await Class.find({ status: 'active' }).select('id class_name class_code').lean({ virtuals: true });

  const classStats = await Promise.all(
    (classes as any[]).map(async (cls) => {
      const [enrollCount, attendance] = await Promise.all([
        Enrollment.countDocuments({ class_id: cls._id, status: 'active' }),
        Attendance.find({ class_id: cls._id, date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } }).select('status').lean(),
      ]);
      const total = (attendance as any[]).length;
      const present = (attendance as any[]).filter((a) => a.status === 'present' || a.status === 'late').length;
      return {
        id: cls._id.toString(),
        class_name: cls.class_name,
        class_code: cls.class_code,
        enrollment_count: enrollCount,
        attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    })
  );

  return classStats.sort((a, b) => b.enrollment_count - a.enrollment_count).slice(0, limit);
}

export async function getOverduePayments(): Promise<{ payments: OverduePayment[]; total: number }> {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];

  const data = await FeePayment.find({ status: 'pending', due_date: { $lt: today } })
    .sort({ due_date: 1 })
    .populate('student_id', 'full_name')
    .lean({ virtuals: true });

  const payments = (data as any[]).map((p) => ({
    student_id: p.student_id?._id?.toString(),
    student_name: p.student_id?.full_name || 'Unknown',
    amount: p.amount,
    due_date: p.due_date,
    days_overdue: Math.floor((new Date().getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  return { payments, total };
}
