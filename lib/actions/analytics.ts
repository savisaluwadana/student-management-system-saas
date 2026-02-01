'use server';

import { createClient } from '@/lib/supabase/server';

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

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient();
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel fetch all stats
    const [
        { count: totalStudents },
        { count: totalClasses },
        { count: totalTeachers },
        { count: totalTutorials },
        { count: activeEnrollments },
        { data: attendanceData },
        { data: revenueData },
        { count: pendingPayments },
    ] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('tutorials').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase
            .from('attendance')
            .select('status')
            .gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
        supabase
            .from('payment_transactions')
            .select('amount')
            .gte('transaction_date', firstOfMonth.toISOString().split('T')[0])
            .eq('status', 'completed'),
        supabase
            .from('fee_payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
    ]);

    // Calculate attendance rate
    const attendanceRecords = attendanceData || [];
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
        (r) => r.status === 'present' || r.status === 'late'
    ).length;
    const attendanceRate = totalAttendance > 0
        ? Math.round((presentCount / totalAttendance) * 100)
        : 0;

    // Calculate revenue
    const revenueThisMonth = (revenueData || []).reduce(
        (sum, t) => sum + (t.amount || 0),
        0
    );

    return {
        totalStudents: totalStudents || 0,
        totalClasses: totalClasses || 0,
        totalTeachers: totalTeachers || 0,
        totalTutorials: totalTutorials || 0,
        activeEnrollments: activeEnrollments || 0,
        attendanceRate,
        revenueThisMonth,
        pendingPayments: pendingPayments || 0,
    };
}

/**
 * Get top classes by enrollment and attendance
 */
export async function getTopClasses(limit = 5): Promise<TopClass[]> {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get classes with enrollment counts
    const { data: classes, error } = await supabase
        .from('classes')
        .select(`
      id,
      class_name,
      class_code,
      enrollments!inner(id)
    `)
        .eq('status', 'active')
        .order('class_name');

    if (error || !classes) {
        console.error('Error fetching top classes:', error);
        return [];
    }

    // Calculate attendance rates for each class
    const classStats = await Promise.all(
        classes.map(async (cls: any) => {
            const { data: attendance } = await supabase
                .from('attendance')
                .select('status')
                .eq('class_id', cls.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

            const total = attendance?.length || 0;
            const present = attendance?.filter(
                (a) => a.status === 'present' || a.status === 'late'
            ).length || 0;

            return {
                id: cls.id,
                class_name: cls.class_name,
                class_code: cls.class_code,
                enrollment_count: cls.enrollments?.length || 0,
                attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
            };
        })
    );

    // Sort by enrollment count and return top N
    return classStats
        .sort((a, b) => b.enrollment_count - a.enrollment_count)
        .slice(0, limit);
}

/**
 * Get overdue payments for the banner
 */
export async function getOverduePayments(): Promise<{
    payments: OverduePayment[];
    total: number;
}> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('fee_payments')
        .select(`
      id,
      amount,
      due_date,
      student_id,
      students(full_name)
    `)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

    if (error) {
        console.error('Error fetching overdue payments:', error);
        return { payments: [], total: 0 };
    }

    const payments = (data || []).map((p: any) => {
        const dueDate = new Date(p.due_date);
        const todayDate = new Date();
        const daysOverdue = Math.floor(
            (todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
            student_id: p.student_id,
            student_name: p.students?.full_name || 'Unknown',
            amount: p.amount,
            due_date: p.due_date,
            days_overdue: daysOverdue,
        };
    });

    const total = payments.reduce((sum, p) => sum + p.amount, 0);

    return { payments, total };
}
