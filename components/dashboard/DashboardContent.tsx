"use client";

import { motion } from "framer-motion";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, GraduationCap, ArrowUpRight, Activity } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface DashboardContentProps {
    data: {
        totalRevenue: number;
        totalStudents: number;
        activeClasses: number;
        totalTeachers: number;
        recentActivities: any[];
        revenueChart: any[];
    };
}

export function DashboardContent({ data }: DashboardContentProps) {
    return (
        <div className="flex-1 space-y-8 p-4 pt-6 bg-transparent">
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
                <div className="flex items-center space-x-2">
                    {/* Date Picker or other actions could go here */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Revenue"
                    icon={DollarSign}
                    value={formatCurrency(data.totalRevenue)}
                    subtext="+20.1% from last month"
                    color="text-foreground"
                    trend="up"
                    delay={0.1}
                />
                <StatsCard
                    title="Active Students"
                    icon={Users}
                    value={`+${data.totalStudents}`}
                    subtext="+180.1% from last month"
                    color="text-foreground"
                    trend="up"
                    delay={0.2}
                />
                <StatsCard
                    title="Active Classes"
                    icon={GraduationCap}
                    value={`+${data.activeClasses}`}
                    subtext="+19% from last month"
                    color="text-foreground"
                    trend="up"
                    delay={0.3}
                />
                <StatsCard
                    title="Teachers"
                    icon={Activity}
                    value={`+${data.totalTeachers}`}
                    subtext="+201 since last hour"
                    color="text-foreground"
                    trend="up"
                    delay={0.4}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
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

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="col-span-3"
                >
                    <Card className="h-full border-none shadow-xl bg-white/40 dark:bg-black/40 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Latest transactions and system events
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {data.recentActivities.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-10">
                                        No recent activity.
                                    </p>
                                ) : (
                                    data.recentActivities.map((activity, i) => (
                                        <div
                                            key={activity.id || i}
                                            className="flex items-center group"
                                        >
                                            <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full items-center justify-center bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700 group-hover:scale-105 transition-transform duration-200">
                                                <span className="font-bold text-foreground">
                                                    {activity.type === "payment"
                                                        ? "$"
                                                        : activity.type === "login"
                                                            ? "L"
                                                            : "S"}
                                                </span>
                                            </div>
                                            <div className="ml-4 space-y-1">
                                                <p className="text-sm font-medium leading-none group-hover:underline underline-offset-4 transition-all">
                                                    {activity.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(activity.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="ml-auto font-medium text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(activity.timestamp).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    ))
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
    trend,
    delay = 0,
}: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 group cursor-default relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="h-16 w-16" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {title}
                    </CardTitle>
                    <div
                        className={cn(
                            "p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800",
                            "text-foreground"
                        )}
                    >
                        <Icon className={cn("h-4 w-4")} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold tracking-tight">{value}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                        {trend === "up" && (
                            <ArrowUpRight className="h-3 w-3 mr-1 text-zinc-500" />
                        )}
                        {subtext}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
