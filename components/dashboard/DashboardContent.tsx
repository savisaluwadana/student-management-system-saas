"use client";

import { motion } from "framer-motion";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { AttendanceTrendChart } from "@/components/dashboard/AttendanceTrendChart";
import { TopClassesWidget } from "@/components/dashboard/TopClassesWidget";
import { OverduePaymentBanner } from "@/components/dashboard/OverduePaymentBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DollarSign,
    Users,
    GraduationCap,
    ArrowUpRight,
    Activity,
    Video,
    CheckCircle2,
    AlertTriangle
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface DashboardContentProps {
    data: {
        totalRevenue: number;
        totalStudents: number;
        activeClasses: number;
        totalTeachers: number;
        totalTutorials: number;
        attendanceRate: number;
        recentActivities: any[];
        revenueChart: any[];
        attendanceTrend: any[];
        topClasses: any[];
        overduePayments: any[];
        totalOverdueAmount: number;
    };
}

export function DashboardContent({ data }: DashboardContentProps) {
    return (
        <div className="flex-1 space-y-6 p-4 pt-6 bg-transparent">
            <div className="flex items-center justify-between space-y-2">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">
                        Dashboard
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Overview of your institute's performance.
                    </p>
                </motion.div>
            </div>

            {/* Overdue Payment Banner */}
            {data.overduePayments.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <OverduePaymentBanner
                        overduePayments={data.overduePayments}
                        totalOverdueAmount={data.totalOverdueAmount}
                    />
                </motion.div>
            )}

            {/* Stats Cards - Now 6 cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatsCard
                    title="Total Revenue"
                    icon={DollarSign}
                    value={formatCurrency(data.totalRevenue)}
                    subtext="All time revenue"
                    color="text-green-500"
                    delay={0.1}
                />
                <StatsCard
                    title="Active Students"
                    icon={Users}
                    value={data.totalStudents.toString()}
                    subtext="Currently enrolled"
                    color="text-blue-500"
                    delay={0.15}
                />
                <StatsCard
                    title="Active Classes"
                    icon={GraduationCap}
                    value={data.activeClasses.toString()}
                    subtext="Running classes"
                    color="text-purple-500"
                    delay={0.2}
                />
                <StatsCard
                    title="Teachers"
                    icon={Activity}
                    value={data.totalTeachers.toString()}
                    subtext="Teaching staff"
                    color="text-orange-500"
                    delay={0.25}
                />
                <StatsCard
                    title="Tutorials"
                    icon={Video}
                    value={data.totalTutorials.toString()}
                    subtext="Learning materials"
                    color="text-pink-500"
                    delay={0.3}
                />
                <StatsCard
                    title="Attendance Rate"
                    icon={CheckCircle2}
                    value={`${data.attendanceRate}%`}
                    subtext="30-day average"
                    color={data.attendanceRate >= 80 ? "text-green-500" : data.attendanceRate >= 60 ? "text-yellow-500" : "text-red-500"}
                    delay={0.35}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="col-span-4"
                >
                    <Card className="h-full border-none shadow-xl bg-white/40 dark:bg-black/40 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
                        <CardHeader>
                            <CardTitle>Revenue Overview</CardTitle>
                            <CardDescription>Monthly revenue performance</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <OverviewChart data={data.revenueChart} />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Top Classes */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="col-span-3"
                >
                    <TopClassesWidget classes={data.topClasses} />
                </motion.div>
            </div>

            {/* Attendance Trend & Recent Activity Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Attendance Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="col-span-4"
                >
                    <AttendanceTrendChart data={data.attendanceTrend} />
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="col-span-3"
                >
                    <Card className="h-full border-none shadow-xl bg-white/40 dark:bg-black/40 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Latest transactions and events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {data.recentActivities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-10">
                                        No recent activity.
                                    </p>
                                ) : (
                                    data.recentActivities.map((activity, i) => {
                                        const date = new Date(activity.timestamp);
                                        const dateStr = `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')}/${date.getUTCFullYear()}`;
                                        const timeStr = `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;

                                        return (
                                            <div
                                                key={activity.id || i}
                                                className="flex items-center group"
                                            >
                                                <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full items-center justify-center bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 group-hover:scale-105 transition-transform duration-200">
                                                    <span className="font-bold text-sm text-foreground">
                                                        {activity.type === "payment"
                                                            ? "$"
                                                            : activity.type === "login"
                                                                ? "L"
                                                                : "S"}
                                                    </span>
                                                </div>
                                                <div className="ml-3 space-y-0.5 flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-none truncate">
                                                        {activity.description}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {dateStr}
                                                    </p>
                                                </div>
                                                <div className="ml-2 font-medium text-xs text-muted-foreground whitespace-nowrap">
                                                    {timeStr}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

function StatsCard({
    title,
    icon: Icon,
    value,
    subtext,
    color,
    delay = 0,
}: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 group cursor-default relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="h-12 w-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {title}
                    </CardTitle>
                    <div className={cn("p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800", color)}>
                        <Icon className="h-3.5 w-3.5" />
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="text-2xl font-bold tracking-tight">{value}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {subtext}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}

