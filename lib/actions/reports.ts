'use server';

import { createClient } from '@/lib/supabase/server';

// Types for report data
export interface FinancialReport {
  monthlyRevenue: MonthlyRevenue[];
  paymentStats: PaymentStats;
  defaulters: Defaulter[];
  revenueByClass: RevenueByClass[];
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  payments: number;
}

export interface PaymentStats {
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalPayments: number;
}

export interface Defaulter {
  student_id: string;
  student_name: string;
  student_code: string;
  total_pending: number;
  overdue_count: number;
}

export interface RevenueByClass {
  class_name: string;
  revenue: number;
  students: number;
}

export interface AttendanceReport {
  dailyStats: DailyAttendanceStats[];
  classComparison: ClassAttendanceComparison[];
  riskStudents: RiskStudent[];
  overallStats: OverallAttendanceStats;
}

export interface DailyAttendanceStats {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  rate: number;
}

export interface ClassAttendanceComparison {
  class_name: string;
  total_sessions: number;
  average_attendance: number;
  present_count: number;
  absent_count: number;
}

export interface RiskStudent {
  student_id: string;
  student_name: string;
  student_code: string;
  total_absences: number;
  attendance_rate: number;
  classes_enrolled: number;
}

export interface OverallAttendanceStats {
  totalSessions: number;
  averageAttendanceRate: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
}

export interface AcademicReport {
  gradeDistribution: GradeDistribution[];
  topPerformers: TopPerformer[];
  classPerformance: ClassPerformance[];
  assessmentStats: AssessmentStats;
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

export interface TopPerformer {
  student_id: string;
  student_name: string;
  student_code: string;
  average_score: number;
  assessments_taken: number;
}

export interface ClassPerformance {
  class_name: string;
  average_score: number;
  assessments_count: number;
  students_count: number;
  highest_score: number;
  lowest_score: number;
}

export interface AssessmentStats {
  totalAssessments: number;
  totalGrades: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

/**
 * Get comprehensive financial report
 */
export async function getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
  const supabase = await createClient();
  
  try {
    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `created_at.gte.${startDate}&created_at.lte.${endDate}`;
    }

    // Get all payments with date filter
    let paymentsQuery = supabase
      .from('fee_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      paymentsQuery = paymentsQuery.gte('created_at', startDate).lte('created_at', endDate);
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) throw paymentsError;

    // Calculate monthly revenue (last 12 months)
    const monthlyRevenue: MonthlyRevenue[] = [];
    const monthsMap = new Map<string, { revenue: number; payments: number }>();
    
    payments?.forEach(payment => {
      const date = new Date(payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthsMap.has(monthKey)) {
        monthsMap.set(monthKey, { revenue: 0, payments: 0 });
      }
      
      const stats = monthsMap.get(monthKey)!;
      stats.revenue += payment.amount_paid || 0;
      stats.payments += 1;
    });

    // Convert to array and sort
    Array.from(monthsMap.entries()).forEach(([month, data]) => {
      monthlyRevenue.push({
        month,
        revenue: data.revenue,
        payments: data.payments
      });
    });
    monthlyRevenue.sort((a, b) => a.month.localeCompare(b.month));

    // Calculate payment stats
    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const paidAmount = payments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
    const pendingAmount = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount - p.amount_paid), 0) || 0;
    const overdueAmount = payments?.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount - p.amount_paid), 0) || 0;

    const paymentStats: PaymentStats = {
      totalRevenue,
      paidAmount,
      pendingAmount,
      overdueAmount,
      totalPayments: payments?.length || 0
    };

    // Get defaulters (students with overdue payments)
    const { data: defaulters, error: defaultersError } = await supabase
      .from('fee_payments')
      .select(`
        student_id,
        amount,
        amount_paid,
        students (
          id,
          full_name,
          student_code
        )
      `)
      .eq('status', 'overdue');

    if (defaultersError) throw defaultersError;

    // Group by student
    const defaultersMap = new Map<string, Defaulter>();
    defaulters?.forEach((payment: any) => {
      const studentId = payment.student_id;
      if (!defaultersMap.has(studentId)) {
        defaultersMap.set(studentId, {
          student_id: studentId,
          student_name: payment.students?.full_name || 'Unknown',
          student_code: payment.students?.student_code || 'N/A',
          total_pending: 0,
          overdue_count: 0
        });
      }
      const defaulter = defaultersMap.get(studentId)!;
      defaulter.total_pending += (payment.amount - payment.amount_paid);
      defaulter.overdue_count += 1;
    });

    const defaultersList = Array.from(defaultersMap.values())
      .sort((a, b) => b.total_pending - a.total_pending)
      .slice(0, 20); // Top 20 defaulters

    // Get revenue by class
    const { data: classRevenue, error: classRevenueError } = await supabase
      .from('fee_payments')
      .select(`
        amount_paid,
        students (
          id,
          enrollments (
            classes (
              class_name
            )
          )
        )
      `);

    if (classRevenueError) throw classRevenueError;

    const revenueByClassMap = new Map<string, { revenue: number; students: Set<string> }>();
    classRevenue?.forEach((payment: any) => {
      const enrollments = payment.students?.enrollments || [];
      enrollments.forEach((enrollment: any) => {
        const className = enrollment.classes?.class_name || 'Unknown';
        if (!revenueByClassMap.has(className)) {
          revenueByClassMap.set(className, { revenue: 0, students: new Set() });
        }
        const classData = revenueByClassMap.get(className)!;
        classData.revenue += payment.amount_paid || 0;
        classData.students.add(payment.students?.id);
      });
    });

    const revenueByClass: RevenueByClass[] = Array.from(revenueByClassMap.entries())
      .map(([class_name, data]) => ({
        class_name,
        revenue: data.revenue,
        students: data.students.size
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      monthlyRevenue,
      paymentStats,
      defaulters: defaultersList,
      revenueByClass
    };
  } catch (error) {
    console.error('Error generating financial report:', error);
    return {
      monthlyRevenue: [],
      paymentStats: {
        totalRevenue: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        totalPayments: 0
      },
      defaulters: [],
      revenueByClass: []
    };
  }
}

/**
 * Get comprehensive attendance analytics report
 */
export async function getAttendanceReport(startDate?: string, endDate?: string): Promise<AttendanceReport> {
  const supabase = await createClient();

  try {
    // Get all attendance records with date filter
    let attendanceQuery = supabase
      .from('attendance')
      .select(`
        *,
        students (id, full_name, student_code),
        classes (id, class_name)
      `)
      .order('date', { ascending: false });

    if (startDate && endDate) {
      attendanceQuery = attendanceQuery.gte('date', startDate).lte('date', endDate);
    }

    const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;

    if (attendanceError) throw attendanceError;

    // Calculate daily stats
    const dailyStatsMap = new Map<string, DailyAttendanceStats>();
    attendanceRecords?.forEach(record => {
      const date = record.date;
      if (!dailyStatsMap.has(date)) {
        dailyStatsMap.set(date, {
          date,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
          rate: 0
        });
      }
      const stats = dailyStatsMap.get(date)!;
      stats.total += 1;
      if (record.status === 'present') stats.present += 1;
      else if (record.status === 'absent') stats.absent += 1;
      else if (record.status === 'late') stats.late += 1;
    });

    const dailyStats = Array.from(dailyStatsMap.entries())
      .map(([date, stats]) => ({
        ...stats,
        rate: stats.total > 0 ? (stats.present / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30); // Last 30 days

    // Calculate class comparison
    const classStatsMap = new Map<string, {
      total_sessions: number;
      present: number;
      absent: number;
    }>();

    attendanceRecords?.forEach((record: any) => {
      const className = record.classes?.class_name || 'Unknown';
      if (!classStatsMap.has(className)) {
        classStatsMap.set(className, {
          total_sessions: 0,
          present: 0,
          absent: 0
        });
      }
      const stats = classStatsMap.get(className)!;
      stats.total_sessions += 1;
      if (record.status === 'present') stats.present += 1;
      else if (record.status === 'absent') stats.absent += 1;
    });

    const classComparison: ClassAttendanceComparison[] = Array.from(classStatsMap.entries())
      .map(([class_name, stats]) => ({
        class_name,
        total_sessions: stats.total_sessions,
        average_attendance: stats.total_sessions > 0 ? (stats.present / stats.total_sessions) * 100 : 0,
        present_count: stats.present,
        absent_count: stats.absent
      }))
      .sort((a, b) => b.average_attendance - a.average_attendance);

    // Find risk students (low attendance)
    const studentStatsMap = new Map<string, {
      name: string;
      code: string;
      total: number;
      absences: number;
      classes: Set<string>;
    }>();

    attendanceRecords?.forEach((record: any) => {
      const studentId = record.student_id;
      if (!studentStatsMap.has(studentId)) {
        studentStatsMap.set(studentId, {
          name: record.students?.full_name || 'Unknown',
          code: record.students?.student_code || 'N/A',
          total: 0,
          absences: 0,
          classes: new Set()
        });
      }
      const stats = studentStatsMap.get(studentId)!;
      stats.total += 1;
      if (record.status === 'absent') stats.absences += 1;
      if (record.classes?.class_name) stats.classes.add(record.classes.class_name);
    });

    const riskStudents: RiskStudent[] = Array.from(studentStatsMap.entries())
      .map(([student_id, stats]) => ({
        student_id,
        student_name: stats.name,
        student_code: stats.code,
        total_absences: stats.absences,
        attendance_rate: stats.total > 0 ? ((stats.total - stats.absences) / stats.total) * 100 : 0,
        classes_enrolled: stats.classes.size
      }))
      .filter(student => student.attendance_rate < 75) // Less than 75% attendance
      .sort((a, b) => a.attendance_rate - b.attendance_rate)
      .slice(0, 20); // Top 20 at-risk students

    // Calculate overall stats
    const totalSessions = attendanceRecords?.length || 0;
    const totalPresent = attendanceRecords?.filter(r => r.status === 'present').length || 0;
    const totalAbsent = attendanceRecords?.filter(r => r.status === 'absent').length || 0;
    const totalLate = attendanceRecords?.filter(r => r.status === 'late').length || 0;

    const overallStats: OverallAttendanceStats = {
      totalSessions,
      averageAttendanceRate: totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0,
      totalPresent,
      totalAbsent,
      totalLate
    };

    return {
      dailyStats,
      classComparison,
      riskStudents,
      overallStats
    };
  } catch (error) {
    console.error('Error generating attendance report:', error);
    return {
      dailyStats: [],
      classComparison: [],
      riskStudents: [],
      overallStats: {
        totalSessions: 0,
        averageAttendanceRate: 0,
        totalPresent: 0,
        totalAbsent: 0,
        totalLate: 0
      }
    };
  }
}

/**
 * Get comprehensive academic performance report
 */
export async function getAcademicReport(startDate?: string, endDate?: string): Promise<AcademicReport> {
  const supabase = await createClient();

  try {
    // Get all grades with assessment info
    let gradesQuery = supabase
      .from('grades')
      .select(`
        *,
        students (id, full_name, student_code),
        assessments (
          id,
          title,
          max_score,
          date,
          classes (id, class_name)
        )
      `)
      .order('created_at', { ascending: false });

    const { data: grades, error: gradesError } = await gradesQuery;

    if (gradesError) throw gradesError;

    // Calculate grade distribution (A, B, C, D, F)
    const gradeCategories = {
      'A (90-100)': 0,
      'B (80-89)': 0,
      'C (70-79)': 0,
      'D (60-69)': 0,
      'F (0-59)': 0
    };

    grades?.forEach(grade => {
      if (!grade.score || !grade.assessments?.max_score) return;
      const percentage = (grade.score / grade.assessments.max_score) * 100;
      
      if (percentage >= 90) gradeCategories['A (90-100)'] += 1;
      else if (percentage >= 80) gradeCategories['B (80-89)'] += 1;
      else if (percentage >= 70) gradeCategories['C (70-79)'] += 1;
      else if (percentage >= 60) gradeCategories['D (60-69)'] += 1;
      else gradeCategories['F (0-59)'] += 1;
    });

    const totalGrades = grades?.length || 0;
    const gradeDistribution: GradeDistribution[] = Object.entries(gradeCategories).map(([grade, count]) => ({
      grade,
      count,
      percentage: totalGrades > 0 ? (count / totalGrades) * 100 : 0
    }));

    // Find top performers
    const studentScoresMap = new Map<string, {
      name: string;
      code: string;
      total_score: number;
      assessments_count: number;
    }>();

    grades?.forEach((grade: any) => {
      if (!grade.score || !grade.assessments?.max_score) return;
      
      const studentId = grade.student_id;
      const percentage = (grade.score / grade.assessments.max_score) * 100;
      
      if (!studentScoresMap.has(studentId)) {
        studentScoresMap.set(studentId, {
          name: grade.students?.full_name || 'Unknown',
          code: grade.students?.student_code || 'N/A',
          total_score: 0,
          assessments_count: 0
        });
      }
      
      const stats = studentScoresMap.get(studentId)!;
      stats.total_score += percentage;
      stats.assessments_count += 1;
    });

    const topPerformers: TopPerformer[] = Array.from(studentScoresMap.entries())
      .map(([student_id, stats]) => ({
        student_id,
        student_name: stats.name,
        student_code: stats.code,
        average_score: stats.assessments_count > 0 ? stats.total_score / stats.assessments_count : 0,
        assessments_taken: stats.assessments_count
      }))
      .filter(p => p.assessments_taken >= 3) // At least 3 assessments
      .sort((a, b) => b.average_score - a.average_score)
      .slice(0, 10); // Top 10 performers

    // Calculate class performance
    const classStatsMap = new Map<string, {
      scores: number[];
      students: Set<string>;
    }>();

    grades?.forEach((grade: any) => {
      if (!grade.score || !grade.assessments?.max_score) return;
      
      const className = grade.assessments?.classes?.class_name || 'Unknown';
      const percentage = (grade.score / grade.assessments.max_score) * 100;
      
      if (!classStatsMap.has(className)) {
        classStatsMap.set(className, {
          scores: [],
          students: new Set()
        });
      }
      
      const stats = classStatsMap.get(className)!;
      stats.scores.push(percentage);
      stats.students.add(grade.student_id);
    });

    const classPerformance: ClassPerformance[] = Array.from(classStatsMap.entries())
      .map(([class_name, stats]) => ({
        class_name,
        average_score: stats.scores.length > 0 
          ? stats.scores.reduce((sum, s) => sum + s, 0) / stats.scores.length 
          : 0,
        assessments_count: stats.scores.length,
        students_count: stats.students.size,
        highest_score: stats.scores.length > 0 ? Math.max(...stats.scores) : 0,
        lowest_score: stats.scores.length > 0 ? Math.min(...stats.scores) : 0
      }))
      .sort((a, b) => b.average_score - a.average_score);

    // Calculate overall assessment stats
    const allScores = grades
      ?.filter((g: any) => g.score && g.assessments?.max_score)
      .map((g: any) => (g.score / g.assessments.max_score) * 100) || [];

    const assessmentStats: AssessmentStats = {
      totalAssessments: new Set(grades?.map((g: any) => g.assessment_id)).size,
      totalGrades: totalGrades,
      averageScore: allScores.length > 0 ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length : 0,
      highestScore: allScores.length > 0 ? Math.max(...allScores) : 0,
      lowestScore: allScores.length > 0 ? Math.min(...allScores) : 0
    };

    return {
      gradeDistribution,
      topPerformers,
      classPerformance,
      assessmentStats
    };
  } catch (error) {
    console.error('Error generating academic report:', error);
    return {
      gradeDistribution: [],
      topPerformers: [],
      classPerformance: [],
      assessmentStats: {
        totalAssessments: 0,
        totalGrades: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0
      }
    };
  }
}
