'use server';

import connectDB from '@/lib/mongodb/client';
import Student from '@/lib/mongodb/models/Student';
import User from '@/lib/mongodb/models/User';
import Class from '@/lib/mongodb/models/Class';
import TutorialModel from '@/lib/mongodb/models/Tutorial';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Attendance from '@/lib/mongodb/models/Attendance';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import { format } from 'date-fns';

export interface ChartData { name: string; revenue: number }
export interface RecentActivity { id: string; type: 'payment' | 'enrollment' | 'login'; description: string; timestamp: string }
export interface AttendanceTrendData { date: string; present: number; absent: number; late: number; total: number }
export interface TopClass { id: string; class_name: string; class_code: string; enrollment_count: number; attendance_rate: number }
export interface OverduePayment { student_id: string; student_name: string; amount: number; due_date: string; days_overdue: number }

export interface FullDashboardData {
  totalStudents: number; totalTeachers: number; totalRevenue: number; activeClasses: number;
  totalTutorials: number; attendanceRate: number; revenueChart: ChartData[];
  recentActivities: RecentActivity[]; attendanceTrend: AttendanceTrendData[];
  topClasses: TopClass[]; overduePayments: OverduePayment[]; totalOverdueAmount: number;
}

export async function getDashboardData(): Promise<FullDashboardData> {
  await connectDB();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date().toISOString().split('T')[0];

  const [studentCount, teacherCount, classCount, tutorialCount] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'teacher' }),
    Class.countDocuments({ status: 'active' }),
    TutorialModel.countDocuments(),
  ]);

  const payments = await FeePayment.find({ status: 'paid' }).select('amount payment_month').lean();
  const totalRevenue = (payments as any[]).reduce((sum, p) => sum + Number(p.amount), 0);

  // Revenue chart (last 6 months)
  const chartMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    chartMap.set(format(d, 'MMM'), 0);
  }
  (payments as any[]).forEach((p) => {
    const key = format(new Date(p.payment_month), 'MMM');
    if (chartMap.has(key)) chartMap.set(key, (chartMap.get(key) || 0) + Number(p.amount));
  });
  const revenueChart: ChartData[] = Array.from(chartMap.entries()).map(([name, revenue]) => ({ name, revenue }));

  // Recent payments as activities
  const recentPayments = await FeePayment.find({ status: 'paid' })
    .sort({ created_at: -1 })
    .limit(5)
    .populate('student_id', 'full_name')
    .lean({ virtuals: true });

  const recentActivities: RecentActivity[] = (recentPayments as any[]).map((p) => ({
    id: p._id.toString(),
    type: 'payment' as const,
    description: `Payment of $${p.amount} received from ${p.student_id?.full_name || 'Unknown'}`,
    timestamp: p.created_at,
  }));

  // Attendance trend
  const attendanceData = await Attendance.find({ date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } })
    .select('date status')
    .sort({ date: 1 })
    .lean();

  const attendanceGrouped = (attendanceData as any[]).reduce((acc: any, record) => {
    if (!acc[record.date]) acc[record.date] = { date: record.date, present: 0, absent: 0, late: 0, total: 0 };
    acc[record.date].total++;
    if (record.status === 'present') acc[record.date].present++;
    else if (record.status === 'absent') acc[record.date].absent++;
    else if (record.status === 'late') acc[record.date].late++;
    return acc;
  }, {});
  const attendanceTrend: AttendanceTrendData[] = Object.values(attendanceGrouped);

  const totalAttendance = attendanceData.length;
  const presentCount = (attendanceData as any[]).filter((a) => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  // Top classes
  const classes = await Class.find({ status: 'active' }).select('id class_name class_code').lean({ virtuals: true });
  const topClasses: TopClass[] = await Promise.all(
    (classes as any[]).slice(0, 5).map(async (cls) => {
      const [enrollCount, clsAttendance] = await Promise.all([
        Enrollment.countDocuments({ class_id: cls._id, status: 'active' }),
        Attendance.find({ class_id: cls._id, date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } }).select('status').lean(),
      ]);
      const total = (clsAttendance as any[]).length;
      const present = (clsAttendance as any[]).filter((a) => a.status === 'present' || a.status === 'late').length;
      return {
        id: cls._id.toString(),
        class_name: cls.class_name,
        class_code: cls.class_code,
        enrollment_count: enrollCount,
        attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    })
  );
  topClasses.sort((a, b) => b.enrollment_count - a.enrollment_count);

  // Overdue payments
  const overdueData = await FeePayment.find({ status: 'pending', due_date: { $lt: today } })
    .sort({ due_date: 1 })
    .limit(10)
    .populate('student_id', 'full_name')
    .lean({ virtuals: true });

  const overduePayments: OverduePayment[] = (overdueData as any[]).map((p) => ({
    student_id: p.student_id?._id?.toString(),
    student_name: p.student_id?.full_name || 'Unknown',
    amount: p.amount,
    due_date: p.due_date,
    days_overdue: Math.floor((new Date().getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)),
  }));
  const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalStudents: studentCount, totalTeachers: teacherCount, activeClasses: classCount,
    totalTutorials: tutorialCount, totalRevenue, attendanceRate, revenueChart,
    recentActivities: recentActivities.slice(0, 5), attendanceTrend, topClasses, overduePayments, totalOverdueAmount,
  };
}
