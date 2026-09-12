"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpenCheck,
  CalendarCheck2,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { AttendanceTrendChart } from "@/components/dashboard/AttendanceTrendChart";
import { TopClassesWidget } from "@/components/dashboard/TopClassesWidget";
import { OverduePaymentBanner } from "@/components/dashboard/OverduePaymentBanner";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

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

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export function DashboardContent({ data }: DashboardContentProps) {
  const hasOverdue = data.overduePayments.length > 0;

  return (
    <div className="space-y-6 py-2">
      <motion.header
        {...fadeUp}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"
      >
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Operations overview</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Your institute, at a glance.</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Monitor attendance, collections, classes and student operations from one workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/reports">View reports</Link>
          </Button>
          <Button asChild>
            <Link href="/students/new">Add student <ArrowUpRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </motion.header>

      {hasOverdue && (
        <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.05 }}>
          <OverduePaymentBanner
            overduePayments={data.overduePayments}
            totalOverdueAmount={data.totalOverdueAmount}
          />
        </motion.div>
      )}

      <motion.section
        {...fadeUp}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          title="Collected revenue"
          value={formatCurrency(data.totalRevenue)}
          detail="All recorded paid fees"
          icon={CircleDollarSign}
          href="/payments"
        />
        <MetricCard
          title="Active students"
          value={data.totalStudents.toLocaleString()}
          detail={`${data.activeClasses} active classes`}
          icon={Users}
          href="/students"
        />
        <MetricCard
          title="Attendance"
          value={`${data.attendanceRate}%`}
          detail="Rolling 30-day attendance"
          icon={CalendarCheck2}
          href="/attendance/reports"
        />
        <MetricCard
          title="Teaching team"
          value={data.totalTeachers.toLocaleString()}
          detail={`${data.totalTutorials} learning resources`}
          icon={GraduationCap}
          href="/teachers"
        />
      </motion.section>

      <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.12 }}>
        <QuickActions />
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.16 }}>
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-base">Revenue trend</CardTitle>
                  <CardDescription>Collections recorded across the last six months.</CardDescription>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  6 months
                </div>
              </CardHeader>
              <CardContent className="pl-1 pr-4 sm:pl-2">
                <OverviewChart data={data.revenueChart} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
            <AttendanceTrendChart data={data.attendanceTrend} />
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.18 }}>
            <OnboardingChecklist
              totalStudents={data.totalStudents}
              totalTeachers={data.totalTeachers}
              activeClasses={data.activeClasses}
              attendanceRate={data.attendanceRate}
              totalRevenue={data.totalRevenue}
            />
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.22 }}>
            <TopClassesWidget classes={data.topClasses} />
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.26 }}>
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Recent activity</CardTitle>
                    <CardDescription>Latest payment events.</CardDescription>
                  </div>
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {data.recentActivities.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-5 text-center">
                    <BookOpenCheck className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">No activity yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">Payments and operational events will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {data.recentActivities.slice(0, 5).map((activity, index) => {
                      const date = new Date(activity.timestamp);
                      const valid = !Number.isNaN(date.getTime());
                      return (
                        <div key={activity.id || index} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-muted/60">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <CircleDollarSign className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-snug">{activity.description}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {valid ? date.toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  href,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">{title}</p>
              <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-muted/45">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-[11px] font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
            Open module <ArrowUpRight className="ml-1 h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
