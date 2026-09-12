'use server';

import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import AttendanceModel from '@/lib/mongodb/models/Attendance';
import Grade from '@/lib/mongodb/models/Grade';
import Assessment from '@/lib/mongodb/models/Assessment';
import { format } from 'date-fns';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export interface FinancialReport { monthlyRevenue: MonthlyRevenue[]; paymentStats: PaymentStats; defaulters: Defaulter[]; revenueByClass: RevenueByClass[]; }
export interface MonthlyRevenue { month: string; revenue: number; payments: number; }
export interface PaymentStats { totalRevenue: number; paidAmount: number; pendingAmount: number; overdueAmount: number; totalPayments: number; }
export interface Defaulter { student_id: string; student_name: string; student_code: string; total_pending: number; overdue_count: number; }
export interface RevenueByClass { class_name: string; revenue: number; students: number; }
export interface AttendanceReport { dailyStats: DailyAttendanceStats[]; classComparison: ClassAttendanceComparison[]; riskStudents: RiskStudent[]; overallStats: OverallAttendanceStats; }
export interface DailyAttendanceStats { date: string; present: number; absent: number; late: number; total: number; rate: number; }
export interface ClassAttendanceComparison { class_name: string; total_sessions: number; average_attendance: number; present_count: number; absent_count: number; }
export interface RiskStudent { student_id: string; student_name: string; student_code: string; total_absences: number; attendance_rate: number; classes_enrolled: number; }
export interface OverallAttendanceStats { totalSessions: number; averageAttendanceRate: number; totalPresent: number; totalAbsent: number; totalLate: number; }
export interface AcademicReport { gradeDistribution: GradeDistribution[]; topPerformers: TopPerformer[]; classPerformance: ClassPerformance[]; assessmentStats: AssessmentStats; }
export interface GradeDistribution { grade: string; count: number; percentage: number; }
export interface TopPerformer { student_id: string; student_name: string; student_code: string; average_score: number; assessments_taken: number; }
export interface ClassPerformance { class_name: string; average_score: number; assessments_count: number; students_count: number; highest_score: number; lowest_score: number; }
export interface AssessmentStats { totalAssessments: number; totalGrades: number; averageScore: number; highestScore: number; lowestScore: number; }

function dateRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return undefined;
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { $gte: start, $lte: end };
}

export async function getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
  await connectDB();
  const context = await requireWorkspaceContext();
  try {
    const range = dateRange(startDate, endDate);
    const payments = await FeePayment.find(workspaceFilter(context, range ? { created_at: range } : {}))
      .sort({ created_at: -1 })
      .populate('student_id', 'id full_name student_code')
      .populate('class_id', 'class_name')
      .lean({ virtuals: true });

    const months = new Map<string, { revenue: number; payments: number }>();
    const defaultersMap = new Map<string, Defaulter>();
    const classMap = new Map<string, { revenue: number; students: Set<string> }>();
    let paidAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    for (const payment of payments as any[]) {
      const amount = Number(payment.amount || 0);
      const month = format(new Date(payment.created_at), 'yyyy-MM');
      if (!months.has(month)) months.set(month, { revenue: 0, payments: 0 });
      months.get(month)!.payments += 1;

      if (payment.status === 'paid') {
        paidAmount += amount;
        months.get(month)!.revenue += amount;
        const className = payment.class_id?.class_name || 'Unassigned';
        if (!classMap.has(className)) classMap.set(className, { revenue: 0, students: new Set() });
        classMap.get(className)!.revenue += amount;
        if (payment.student_id?._id) classMap.get(className)!.students.add(payment.student_id._id.toString());
      } else if (payment.status === 'overdue') {
        overdueAmount += amount;
        const studentId = payment.student_id?._id?.toString();
        if (studentId) {
          if (!defaultersMap.has(studentId)) {
            defaultersMap.set(studentId, {
              student_id: studentId,
              student_name: payment.student_id?.full_name || 'Unknown',
              student_code: payment.student_id?.student_code || 'N/A',
              total_pending: 0,
              overdue_count: 0,
            });
          }
          defaultersMap.get(studentId)!.total_pending += amount;
          defaultersMap.get(studentId)!.overdue_count += 1;
        }
      } else if (payment.status === 'pending' || payment.status === 'unpaid') {
        pendingAmount += amount;
      }
    }

    return {
      monthlyRevenue: Array.from(months.entries()).map(([month, data]) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month)),
      paymentStats: { totalRevenue: paidAmount, paidAmount, pendingAmount, overdueAmount, totalPayments: payments.length },
      defaulters: Array.from(defaultersMap.values()).sort((a, b) => b.total_pending - a.total_pending).slice(0, 20),
      revenueByClass: Array.from(classMap.entries()).map(([class_name, data]) => ({ class_name, revenue: data.revenue, students: data.students.size })).sort((a, b) => b.revenue - a.revenue),
    };
  } catch (error) {
    console.error('Error generating financial report:', error);
    return { monthlyRevenue: [], paymentStats: { totalRevenue: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, totalPayments: 0 }, defaulters: [], revenueByClass: [] };
  }
}

export async function getAttendanceReport(startDate?: string, endDate?: string): Promise<AttendanceReport> {
  await connectDB();
  const context = await requireWorkspaceContext();
  try {
    const filter: Record<string, unknown> = {};
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    const records = await AttendanceModel.find(workspaceFilter(context, filter))
      .sort({ date: -1 })
      .populate('student_id', 'id full_name student_code')
      .populate('class_id', 'class_name')
      .lean({ virtuals: true });

    const dailyMap = new Map<string, DailyAttendanceStats>();
    const classMap = new Map<string, { total: number; present: number; absent: number }>();
    const studentMap = new Map<string, { name: string; code: string; total: number; absences: number; classes: Set<string> }>();

    for (const record of records as any[]) {
      if (!dailyMap.has(record.date)) dailyMap.set(record.date, { date: record.date, present: 0, absent: 0, late: 0, total: 0, rate: 0 });
      const daily = dailyMap.get(record.date)!;
      daily.total += 1;
      if (record.status === 'present') daily.present += 1;
      else if (record.status === 'absent') daily.absent += 1;
      else if (record.status === 'late') daily.late += 1;

      const className = record.class_id?.class_name || 'Unknown';
      if (!classMap.has(className)) classMap.set(className, { total: 0, present: 0, absent: 0 });
      const classStats = classMap.get(className)!;
      classStats.total += 1;
      if (record.status === 'present' || record.status === 'late') classStats.present += 1;
      if (record.status === 'absent') classStats.absent += 1;

      const studentId = record.student_id?._id?.toString();
      if (studentId) {
        if (!studentMap.has(studentId)) studentMap.set(studentId, { name: record.student_id?.full_name || 'Unknown', code: record.student_id?.student_code || 'N/A', total: 0, absences: 0, classes: new Set() });
        const stats = studentMap.get(studentId)!;
        stats.total += 1;
        if (record.status === 'absent') stats.absences += 1;
        if (record.class_id?.class_name) stats.classes.add(record.class_id.class_name);
      }
    }

    const dailyStats = Array.from(dailyMap.values()).map((stats) => ({ ...stats, rate: stats.total ? ((stats.present + stats.late) / stats.total) * 100 : 0 })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    const classComparison = Array.from(classMap.entries()).map(([class_name, stats]) => ({ class_name, total_sessions: stats.total, average_attendance: stats.total ? (stats.present / stats.total) * 100 : 0, present_count: stats.present, absent_count: stats.absent })).sort((a, b) => b.average_attendance - a.average_attendance);
    const riskStudents = Array.from(studentMap.entries()).map(([student_id, stats]) => ({ student_id, student_name: stats.name, student_code: stats.code, total_absences: stats.absences, attendance_rate: stats.total ? ((stats.total - stats.absences) / stats.total) * 100 : 0, classes_enrolled: stats.classes.size })).filter((student) => student.attendance_rate < 75).sort((a, b) => a.attendance_rate - b.attendance_rate).slice(0, 20);

    const totalSessions = records.length;
    const totalPresent = (records as any[]).filter((record) => record.status === 'present').length;
    const totalAbsent = (records as any[]).filter((record) => record.status === 'absent').length;
    const totalLate = (records as any[]).filter((record) => record.status === 'late').length;
    return {
      dailyStats,
      classComparison,
      riskStudents,
      overallStats: { totalSessions, averageAttendanceRate: totalSessions ? ((totalPresent + totalLate) / totalSessions) * 100 : 0, totalPresent, totalAbsent, totalLate },
    };
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return { dailyStats: [], classComparison: [], riskStudents: [], overallStats: { totalSessions: 0, averageAttendanceRate: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 } };
  }
}

export async function getAcademicReport(startDate?: string, endDate?: string): Promise<AcademicReport> {
  await connectDB();
  const context = await requireWorkspaceContext();
  try {
    const assessmentFilter: Record<string, unknown> = {};
    if (startDate && endDate) assessmentFilter.date = { $gte: startDate, $lte: endDate };
    const assessments = await Assessment.find(workspaceFilter(context, assessmentFilter)).select('_id').lean();
    const assessmentIds = (assessments as any[]).map((assessment) => assessment._id);
    const grades = assessmentIds.length
      ? await Grade.find(workspaceFilter(context, { assessment_id: { $in: assessmentIds } }))
          .populate('student_id', 'id full_name student_code')
          .populate({ path: 'assessment_id', select: 'title max_score date class_id', populate: { path: 'class_id', select: 'class_name' } })
          .lean({ virtuals: true })
      : [];

    const categories: Record<string, number> = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (0-59)': 0 };
    const scored = (grades as any[]).filter((grade) => grade.score != null && Number(grade.assessment_id?.max_score) > 0);
    const students = new Map<string, { name: string; code: string; scores: number[] }>();
    const classes = new Map<string, { scores: number[]; students: Set<string>; assessments: Set<string> }>();
    const allScores: number[] = [];

    for (const grade of scored) {
      const pct = (Number(grade.score) / Number(grade.assessment_id.max_score)) * 100;
      allScores.push(pct);
      if (pct >= 90) categories['A (90-100)'] += 1;
      else if (pct >= 80) categories['B (80-89)'] += 1;
      else if (pct >= 70) categories['C (70-79)'] += 1;
      else if (pct >= 60) categories['D (60-69)'] += 1;
      else categories['F (0-59)'] += 1;

      const sid = grade.student_id?._id?.toString();
      if (sid) {
        if (!students.has(sid)) students.set(sid, { name: grade.student_id?.full_name || 'Unknown', code: grade.student_id?.student_code || 'N/A', scores: [] });
        students.get(sid)!.scores.push(pct);
      }
      const className = grade.assessment_id?.class_id?.class_name || 'Unknown';
      if (!classes.has(className)) classes.set(className, { scores: [], students: new Set(), assessments: new Set() });
      const classStats = classes.get(className)!;
      classStats.scores.push(pct);
      if (sid) classStats.students.add(sid);
      if (grade.assessment_id?._id) classStats.assessments.add(grade.assessment_id._id.toString());
    }

    const gradeDistribution = Object.entries(categories).map(([grade, count]) => ({ grade, count, percentage: scored.length ? (count / scored.length) * 100 : 0 }));
    const topPerformers = Array.from(students.entries()).map(([student_id, stats]) => ({ student_id, student_name: stats.name, student_code: stats.code, average_score: stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length, assessments_taken: stats.scores.length })).filter((student) => student.assessments_taken >= 3).sort((a, b) => b.average_score - a.average_score).slice(0, 10);
    const classPerformance = Array.from(classes.entries()).map(([class_name, stats]) => ({ class_name, average_score: stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length, assessments_count: stats.assessments.size, students_count: stats.students.size, highest_score: Math.max(...stats.scores), lowest_score: Math.min(...stats.scores) })).sort((a, b) => b.average_score - a.average_score);
    const assessmentStats = { totalAssessments: assessmentIds.length, totalGrades: grades.length, averageScore: allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0, highestScore: allScores.length ? Math.max(...allScores) : 0, lowestScore: allScores.length ? Math.min(...allScores) : 0 };

    return { gradeDistribution, topPerformers, classPerformance, assessmentStats };
  } catch (error) {
    console.error('Error generating academic report:', error);
    return { gradeDistribution: [], topPerformers: [], classPerformance: [], assessmentStats: { totalAssessments: 0, totalGrades: 0, averageScore: 0, highestScore: 0, lowestScore: 0 } };
  }
}
