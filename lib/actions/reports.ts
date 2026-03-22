'use server';

import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import AttendanceModel from '@/lib/mongodb/models/Attendance';
import Grade from '@/lib/mongodb/models/Grade';
import Assessment from '@/lib/mongodb/models/Assessment';
import mongoose from 'mongoose';
import { format } from 'date-fns';

// ---- Types (unchanged) ----
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

export async function getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
  await connectDB();

  try {
    const filter: any = {};
    if (startDate && endDate) filter.created_at = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const payments = await FeePayment.find(filter)
      .sort({ created_at: -1 })
      .populate('student_id', 'id full_name student_code')
      .populate('class_id', 'class_name')
      .lean({ virtuals: true });

    // Monthly revenue
    const monthsMap = new Map<string, { revenue: number; payments: number }>();
    (payments as any[]).forEach((p) => {
      const key = format(new Date(p.created_at), 'yyyy-MM');
      if (!monthsMap.has(key)) monthsMap.set(key, { revenue: 0, payments: 0 });
      const stats = monthsMap.get(key)!;
      if (p.status === 'paid') stats.revenue += p.amount || 0;
      stats.payments += 1;
    });
    const monthlyRevenue: MonthlyRevenue[] = Array.from(monthsMap.entries())
      .map(([month, data]) => ({ month, revenue: data.revenue, payments: data.payments }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Payment stats
    const totalRevenue = (payments as any[]).reduce((s, p) => s + (p.amount || 0), 0);
    const paidAmount = (payments as any[]).filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pendingAmount = (payments as any[]).filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const overdueAmount = (payments as any[]).filter((p) => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    const paymentStats: PaymentStats = { totalRevenue, paidAmount, pendingAmount, overdueAmount, totalPayments: payments.length };

    // Defaulters (overdue payments grouped by student)
    const defaultersMap = new Map<string, Defaulter>();
    (payments as any[]).filter((p) => p.status === 'overdue').forEach((p) => {
      const sid = p.student_id?._id?.toString();
      if (!defaultersMap.has(sid)) {
        defaultersMap.set(sid, {
          student_id: sid,
          student_name: p.student_id?.full_name || 'Unknown',
          student_code: p.student_id?.student_code || 'N/A',
          total_pending: 0,
          overdue_count: 0,
        });
      }
      const d = defaultersMap.get(sid)!;
      d.total_pending += p.amount;
      d.overdue_count += 1;
    });
    const defaulters = Array.from(defaultersMap.values()).sort((a, b) => b.total_pending - a.total_pending).slice(0, 20);

    // Revenue by class
    const revByClass = new Map<string, { revenue: number; students: Set<string> }>();
    (payments as any[]).filter((p) => p.status === 'paid').forEach((p) => {
      const className = p.class_id?.class_name || 'Unknown';
      if (!revByClass.has(className)) revByClass.set(className, { revenue: 0, students: new Set() });
      const r = revByClass.get(className)!;
      r.revenue += p.amount;
      if (p.student_id?._id) r.students.add(p.student_id._id.toString());
    });
    const revenueByClass: RevenueByClass[] = Array.from(revByClass.entries())
      .map(([class_name, data]) => ({ class_name, revenue: data.revenue, students: data.students.size }))
      .sort((a, b) => b.revenue - a.revenue);

    return { monthlyRevenue, paymentStats, defaulters, revenueByClass };
  } catch (error) {
    console.error('Error generating financial report:', error);
    return { monthlyRevenue: [], paymentStats: { totalRevenue: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, totalPayments: 0 }, defaulters: [], revenueByClass: [] };
  }
}

export async function getAttendanceReport(startDate?: string, endDate?: string): Promise<AttendanceReport> {
  await connectDB();

  try {
    const filter: any = {};
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };

    const records = await AttendanceModel.find(filter)
      .sort({ date: -1 })
      .populate('student_id', 'id full_name student_code')
      .populate('class_id', 'class_name')
      .lean({ virtuals: true });

    // Daily stats
    const dailyMap = new Map<string, DailyAttendanceStats>();
    (records as any[]).forEach((r) => {
      if (!dailyMap.has(r.date)) dailyMap.set(r.date, { date: r.date, present: 0, absent: 0, late: 0, total: 0, rate: 0 });
      const s = dailyMap.get(r.date)!;
      s.total++;
      if (r.status === 'present') s.present++;
      else if (r.status === 'absent') s.absent++;
      else if (r.status === 'late') s.late++;
    });
    const dailyStats = Array.from(dailyMap.values())
      .map((s) => ({ ...s, rate: s.total > 0 ? (s.present / s.total) * 100 : 0 }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    // Class comparison
    const classMap = new Map<string, { total_sessions: number; present: number; absent: number }>();
    (records as any[]).forEach((r) => {
      const className = r.class_id?.class_name || 'Unknown';
      if (!classMap.has(className)) classMap.set(className, { total_sessions: 0, present: 0, absent: 0 });
      const s = classMap.get(className)!;
      s.total_sessions++;
      if (r.status === 'present') s.present++;
      else if (r.status === 'absent') s.absent++;
    });
    const classComparison: ClassAttendanceComparison[] = Array.from(classMap.entries())
      .map(([class_name, s]) => ({ class_name, total_sessions: s.total_sessions, average_attendance: s.total_sessions > 0 ? (s.present / s.total_sessions) * 100 : 0, present_count: s.present, absent_count: s.absent }))
      .sort((a, b) => b.average_attendance - a.average_attendance);

    // Risk students
    const studentMap = new Map<string, { name: string; code: string; total: number; absences: number; classes: Set<string> }>();
    (records as any[]).forEach((r) => {
      const sid = r.student_id?._id?.toString();
      if (!studentMap.has(sid)) studentMap.set(sid, { name: r.student_id?.full_name || 'Unknown', code: r.student_id?.student_code || 'N/A', total: 0, absences: 0, classes: new Set() });
      const s = studentMap.get(sid)!;
      s.total++;
      if (r.status === 'absent') s.absences++;
      if (r.class_id?.class_name) s.classes.add(r.class_id.class_name);
    });
    const riskStudents: RiskStudent[] = Array.from(studentMap.entries())
      .map(([student_id, s]) => ({ student_id, student_name: s.name, student_code: s.code, total_absences: s.absences, attendance_rate: s.total > 0 ? ((s.total - s.absences) / s.total) * 100 : 0, classes_enrolled: s.classes.size }))
      .filter((s) => s.attendance_rate < 75)
      .sort((a, b) => a.attendance_rate - b.attendance_rate)
      .slice(0, 20);

    const totalSessions = records.length;
    const totalPresent = (records as any[]).filter((r) => r.status === 'present').length;
    const totalAbsent = (records as any[]).filter((r) => r.status === 'absent').length;
    const totalLate = (records as any[]).filter((r) => r.status === 'late').length;

    return {
      dailyStats,
      classComparison,
      riskStudents,
      overallStats: { totalSessions, averageAttendanceRate: totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0, totalPresent, totalAbsent, totalLate },
    };
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return { dailyStats: [], classComparison: [], riskStudents: [], overallStats: { totalSessions: 0, averageAttendanceRate: 0, totalPresent: 0, totalAbsent: 0, totalLate: 0 } };
  }
}

export async function getAcademicReport(startDate?: string, endDate?: string): Promise<AcademicReport> {
  await connectDB();

  try {
    const grades = await Grade.find({})
      .sort({ created_at: -1 })
      .populate('student_id', 'id full_name student_code')
      .populate({ path: 'assessment_id', select: 'title max_score date class_id', populate: { path: 'class_id', select: 'class_name' } })
      .lean({ virtuals: true });

    const gradeCategories: Record<string, number> = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (0-59)': 0 };
    const scoredGrades = (grades as any[]).filter((g) => g.score != null && g.assessment_id?.max_score);

    scoredGrades.forEach((g) => {
      const pct = (g.score / g.assessment_id.max_score) * 100;
      if (pct >= 90) gradeCategories['A (90-100)']++;
      else if (pct >= 80) gradeCategories['B (80-89)']++;
      else if (pct >= 70) gradeCategories['C (70-79)']++;
      else if (pct >= 60) gradeCategories['D (60-69)']++;
      else gradeCategories['F (0-59)']++;
    });
    const gradeDistribution: GradeDistribution[] = Object.entries(gradeCategories).map(([grade, count]) => ({
      grade, count, percentage: grades.length > 0 ? (count / grades.length) * 100 : 0,
    }));

    // Top performers
    const studentMap = new Map<string, { name: string; code: string; total_score: number; count: number }>();
    scoredGrades.forEach((g) => {
      const sid = g.student_id?._id?.toString();
      if (!studentMap.has(sid)) studentMap.set(sid, { name: g.student_id?.full_name || 'Unknown', code: g.student_id?.student_code || 'N/A', total_score: 0, count: 0 });
      const s = studentMap.get(sid)!;
      s.total_score += (g.score / g.assessment_id.max_score) * 100;
      s.count++;
    });
    const topPerformers: TopPerformer[] = Array.from(studentMap.entries())
      .map(([student_id, s]) => ({ student_id, student_name: s.name, student_code: s.code, average_score: s.count > 0 ? s.total_score / s.count : 0, assessments_taken: s.count }))
      .filter((p) => p.assessments_taken >= 3)
      .sort((a, b) => b.average_score - a.average_score)
      .slice(0, 10);

    // Class performance
    const classMap = new Map<string, { scores: number[]; students: Set<string> }>();
    scoredGrades.forEach((g) => {
      const className = g.assessment_id?.class_id?.class_name || 'Unknown';
      if (!classMap.has(className)) classMap.set(className, { scores: [], students: new Set() });
      const s = classMap.get(className)!;
      s.scores.push((g.score / g.assessment_id.max_score) * 100);
      s.students.add(g.student_id?._id?.toString());
    });
    const classPerformance: ClassPerformance[] = Array.from(classMap.entries())
      .map(([class_name, s]) => ({
        class_name,
        average_score: s.scores.length > 0 ? s.scores.reduce((a, b) => a + b, 0) / s.scores.length : 0,
        assessments_count: s.scores.length, students_count: s.students.size,
        highest_score: s.scores.length > 0 ? Math.max(...s.scores) : 0,
        lowest_score: s.scores.length > 0 ? Math.min(...s.scores) : 0,
      }))
      .sort((a, b) => b.average_score - a.average_score);

    const allScores = scoredGrades.map((g) => (g.score / g.assessment_id.max_score) * 100);
    const assessmentStats: AssessmentStats = {
      totalAssessments: new Set(scoredGrades.map((g) => g.assessment_id?._id?.toString())).size,
      totalGrades: grades.length,
      averageScore: allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0,
      highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0,
    };

    return { gradeDistribution, topPerformers, classPerformance, assessmentStats };
  } catch (error) {
    console.error('Error generating academic report:', error);
    return { gradeDistribution: [], topPerformers: [], classPerformance: [], assessmentStats: { totalAssessments: 0, totalGrades: 0, averageScore: 0, highestScore: 0, lowestScore: 0 } };
  }
}
