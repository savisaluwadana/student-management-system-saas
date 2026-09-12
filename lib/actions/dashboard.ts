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

const formatActivityAmount = (amount: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(amount);

export async function getDashboardData(): Promise<FullDashboardData> {
  await connectDB();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoKey = thirtyDaysAgo.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [studentCount, teacherCount, classCount, tutorialCount, payments, recentPayments, attendanceData, classes, overdueData] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    User.countDocuments({ role: 'teacher' }),
    Class.countDocuments({ status: 'active' }),
    TutorialModel.countDocuments(),
    FeePayment.find({ status: 'paid' }).select('amount payment_month').lean(),
    FeePayment.find({ status: 'paid' })
      .sort({ created_at: -1 })
      .limit(5)
      .populate('student_id', 'full_name')
      .lean({ virtuals: true }),
    Attendance.find({ date: { $gte: thirtyDaysAgoKey } })
      .select('date status')
      .sort({ date: 1 })
      .lean(),
    Class.find({ status: 'active' }).select('class_name class_code').lean({ virtuals: true }),
    FeePayment.find({ status: 'pending', due_date: { $lt: today } })
      .sort({ due_date: 1 })
      .limit(10)
      .populate('student_id', 'full_name')
      .lean({ virtuals: true }),
  ]);

  const totalRevenue = (payments as any[]).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const chartMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    chartMap.set(format(date, 'MMM'), 0);
  }

  (payments as any[]).forEach((payment) => {
    if (!payment.payment_month) return;
    const key = format(new Date(payment.payment_month), 'MMM');
    if (chartMap.has(key)) {
      chartMap.set(key, (chartMap.get(key) || 0) + Number(payment.amount || 0));
    }
  });

  const revenueChart: ChartData[] = Array.from(chartMap.entries()).map(([name, revenue]) => ({ name, revenue }));

  const recentActivities: RecentActivity[] = (recentPayments as any[]).map((payment) => ({
    id: payment._id.toString(),
    type: 'payment' as const,
    description: `${formatActivityAmount(Number(payment.amount || 0))} received from ${payment.student_id?.full_name || 'Unknown student'}`,
    timestamp: new Date(payment.created_at).toISOString(),
  }));

  const attendanceGrouped = (attendanceData as any[]).reduce((acc: Record<string, AttendanceTrendData>, record) => {
    if (!acc[record.date]) {
      acc[record.date] = { date: record.date, present: 0, absent: 0, late: 0, total: 0 };
    }
    acc[record.date].total += 1;
    if (record.status === 'present') acc[record.date].present += 1;
    else if (record.status === 'absent') acc[record.date].absent += 1;
    else if (record.status === 'late') acc[record.date].late += 1;
    return acc;
  }, {});

  const attendanceTrend: AttendanceTrendData[] = Object.values(attendanceGrouped);
  const totalAttendance = attendanceData.length;
  const presentCount = (attendanceData as any[]).filter((attendance) => attendance.status === 'present' || attendance.status === 'late').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  const topClasses: TopClass[] = await Promise.all(
    (classes as any[]).slice(0, 5).map(async (classItem) => {
      const [enrollCount, classAttendance] = await Promise.all([
        Enrollment.countDocuments({ class_id: classItem._id, status: 'active' }),
        Attendance.find({ class_id: classItem._id, date: { $gte: thirtyDaysAgoKey } }).select('status').lean(),
      ]);
      const total = (classAttendance as any[]).length;
      const present = (classAttendance as any[]).filter((attendance) => attendance.status === 'present' || attendance.status === 'late').length;
      return {
        id: classItem._id.toString(),
        class_name: classItem.class_name,
        class_code: classItem.class_code,
        enrollment_count: enrollCount,
        attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    })
  );
  topClasses.sort((a, b) => b.enrollment_count - a.enrollment_count);

  const overduePayments: OverduePayment[] = (overdueData as any[]).map((payment) => ({
    student_id: payment.student_id?._id?.toString() || '',
    student_name: payment.student_id?.full_name || 'Unknown student',
    amount: Number(payment.amount || 0),
    due_date: payment.due_date,
    days_overdue: Math.max(0, Math.floor((Date.now() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))),
  }));

  return {
    totalStudents: studentCount,
    totalTeachers: teacherCount,
    activeClasses: classCount,
    totalTutorials: tutorialCount,
    totalRevenue,
    attendanceRate,
    revenueChart,
    recentActivities,
    attendanceTrend,
    topClasses,
    overduePayments,
    totalOverdueAmount: overduePayments.reduce((sum, payment) => sum + payment.amount, 0),
  };
}
