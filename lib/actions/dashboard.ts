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

export interface FullDashboardData {
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    activeClasses: number;
    revenueChart: ChartData[];
    recentActivities: RecentActivity[];
}

export async function getDashboardData(): Promise<FullDashboardData> {
    const supabase = await createClient();

    // 1. Basic Counts
    const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("status", "active");
    const { count: teacherCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher");
    const { count: classCount } = await supabase.from("classes").select("*", { count: "exact", head: true }).eq("status", "active");

    // 2. Revenue (Total Paid)
    const { data: payments } = await supabase
        .from("fee_payments")
        .select("amount, payment_month")
        .eq("status", "paid");

    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 3. Chart Data (Revenue by Month for last 6 months)
    // Group payments by month. ensuring 'payment_month' is used.
    // Note: doing this in JS since Supabase simple client doesn't do complex group-by easy without RPC.
    const chartMap = new Map<string, number>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = format(d, "MMM");
        chartMap.set(key, 0);
    }

    payments?.forEach(p => {
        const date = new Date(p.payment_month);
        const key = format(date, "MMM");
        // Only include if in the last 6 months window
        if (chartMap.has(key)) {
            chartMap.set(key, (chartMap.get(key) || 0) + Number(p.amount));
        }
    });

    const revenueChart: ChartData[] = Array.from(chartMap.entries()).map(([name, revenue]) => ({ name, revenue }));

    // 4. Recent Activity
    // We'll mock "Login" but use actual "Payment" and "Student" creations if available.
    // We can query 'attendance' or 'fee_payments' for latest.

    const activities: RecentActivity[] = [];

    // Latest 5 payments
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

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        activeClasses: classCount || 0,
        totalRevenue,
        revenueChart,
        recentActivities: activities.slice(0, 5)
    };
}
