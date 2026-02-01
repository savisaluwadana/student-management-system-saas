"use server";

import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

export interface ChartData {
    name: string;
    revenue: number;
}

export interface RecentActivity {
    id: string;
    type: "payment" | "enrollment" | "login";
    description: string;
    timestamp: string;
}

export interface AttendanceTrendData {
    date: string;
    present: number;
    absent: number;
    late: number;
    total: number;
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

export interface FullDashboardData {
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    activeClasses: number;
    totalTutorials: number;
    attendanceRate: number;
    revenueChart: ChartData[];
    recentActivities: RecentActivity[];
    attendanceTrend: AttendanceTrendData[];
    topClasses: TopClass[];
    overduePayments: OverduePayment[];
    totalOverdueAmount: number;
}

export async function getDashboardData(): Promise<FullDashboardData> {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date().toISOString().split('T')[0];

    // 1. Basic Counts
    const [
        { count: studentCount },
        { count: teacherCount },
        { count: classCount },
        { count: tutorialCount },
    ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("classes").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("tutorials").select("*", { count: "exact", head: true }),
    ]);

    // 2. Revenue (Total Paid)
    const { data: payments } = await supabase
        .from("fee_payments")
        .select("amount, payment_month")
        .eq("status", "paid");

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 3. Chart Data (Revenue by Month for last 6 months)
    const chartMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = format(d, "MMM");
        chartMap.set(key, 0);
    }

    payments?.forEach(p => {
        const date = new Date(p.payment_month);
        const key = format(date, "MMM");
        if (chartMap.has(key)) {
            chartMap.set(key, (chartMap.get(key) || 0) + Number(p.amount));
        }
    });

    const revenueChart: ChartData[] = Array.from(chartMap.entries()).map(([name, revenue]) => ({ name, revenue }));

    // 4. Recent Activity
    const activities: RecentActivity[] = [];
    const { data: recentPayments } = await supabase
        .from("fee_payments")
        .select("id, amount, students(full_name), created_at")
        .order("created_at", { ascending: false })
        .limit(5);

    recentPayments?.forEach(p => {
        activities.push({
            id: p.id,
            type: "payment",
            description: `Payment of $${p.amount} received from ${Array.isArray(p.students) ? p.students[0]?.full_name : (p.students as any)?.full_name || 'Unknown'}`,
            timestamp: p.created_at
        })
    });
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 5. Attendance Trend (30 days)
    const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

    const attendanceGrouped = (attendanceData || []).reduce((acc: any, record) => {
        if (!acc[record.date]) {
            acc[record.date] = { date: record.date, present: 0, absent: 0, late: 0, total: 0 };
        }
        acc[record.date].total++;
        if (record.status === 'present') acc[record.date].present++;
        else if (record.status === 'absent') acc[record.date].absent++;
        else if (record.status === 'late') acc[record.date].late++;
        return acc;
    }, {});
    const attendanceTrend: AttendanceTrendData[] = Object.values(attendanceGrouped);

    // Calculate attendance rate
    const totalAttendance = attendanceData?.length || 0;
    const presentCount = attendanceData?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    // 6. Top Classes
    const { data: classes } = await supabase
        .from('classes')
        .select(`id, class_name, class_code, enrollments(id)`)
        .eq('status', 'active');

    const topClasses: TopClass[] = await Promise.all(
        (classes || []).slice(0, 5).map(async (cls: any) => {
            const { data: clsAttendance } = await supabase
                .from('attendance')
                .select('status')
                .eq('class_id', cls.id)
                .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

            const total = clsAttendance?.length || 0;
            const present = clsAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;

            return {
                id: cls.id,
                class_name: cls.class_name,
                class_code: cls.class_code,
                enrollment_count: cls.enrollments?.length || 0,
                attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0,
            };
        })
    );
    topClasses.sort((a, b) => b.enrollment_count - a.enrollment_count);

    // 7. Overdue Payments
    const { data: overdueData } = await supabase
        .from('fee_payments')
        .select(`id, amount, due_date, student_id, students(full_name)`)
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true })
        .limit(10);

    const overduePayments: OverduePayment[] = (overdueData || []).map((p: any) => {
        const dueDate = new Date(p.due_date);
        const todayDate = new Date();
        const daysOverdue = Math.floor((todayDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
            student_id: p.student_id,
            student_name: p.students?.full_name || 'Unknown',
            amount: p.amount,
            due_date: p.due_date,
            days_overdue: daysOverdue,
        };
    });
    const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        activeClasses: classCount || 0,
        totalTutorials: tutorialCount || 0,
        totalRevenue,
        attendanceRate,
        revenueChart,
        recentActivities: activities.slice(0, 5),
        attendanceTrend,
        topClasses,
        overduePayments,
        totalOverdueAmount,
    };
}

