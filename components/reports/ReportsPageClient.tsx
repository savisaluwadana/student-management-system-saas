'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, Users, DollarSign, Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import { FinancialReportsContent } from '@/components/reports/FinancialReports';
import { AttendanceReportsContent } from '@/components/reports/AttendanceReports';
import { AcademicReportsContent } from '@/components/reports/AcademicReports';
import { ExportReportsButton } from '@/components/reports/ExportReportsButton';
import { DateRangeSelector } from '@/components/reports/DateRangeSelector';
import { Button } from '@/components/ui/button';
import type { FinancialReport, AttendanceReport, AcademicReport } from '@/lib/actions/reports';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface ReportsPageClientProps {
  initialStats: { totalStudents: number; totalClasses: number };
  initialFinancialData: FinancialReport;
  initialAttendanceData: AttendanceReport;
  initialAcademicData: AcademicReport;
  startDate?: string;
  endDate?: string;
}

export function ReportsPageClient({
  initialStats,
  initialFinancialData,
  initialAttendanceData,
  initialAcademicData,
  startDate,
  endDate,
}: ReportsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);

  const handleDateRangeChange = (start: string | undefined, end: string | undefined) => {
    const params = new URLSearchParams();
    if (start) params.set('startDate', start);
    if (end) params.set('endDate', end);
    
    startTransition(() => {
      router.push(`/reports?${params.toString()}`);
      setFilterOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Reports Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Analytics and detailed reports across all modules
            {startDate && endDate && (
              <span className="ml-2 text-sm text-primary">
                • Filtered: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Date Filter
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Reports</SheetTitle>
                <SheetDescription>
                  Select a date range to filter all reports
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
              </div>
            </SheetContent>
          </Sheet>
          
          <ExportReportsButton
            reportType="all"
            data={{
              financial: initialFinancialData,
              attendance: initialAttendanceData,
              academic: initialAcademicData,
            }}
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{initialStats.totalStudents}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{initialStats.totalClasses}</p>
              <p className="text-sm text-muted-foreground">Active Classes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">Finance</p>
              <p className="text-sm text-muted-foreground">Revenue Tracking</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">Attendance</p>
              <p className="text-sm text-muted-foreground">Daily Tracking</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPending && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading filtered data...</span>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-background/50 backdrop-blur-xl border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial Reports</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Reports</TabsTrigger>
          <TabsTrigger value="academic">Academic Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-lg font-semibold">Financial Overview</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Monthly revenue and pending payments</p>
                <p className="text-sm text-muted-foreground mb-4">
                  View detailed breakdown of fee collections, outstanding balances, and revenue projections.
                </p>
                <Link href="/payments">
                  <Button variant="outline" className="w-full">
                    View Detailed Report
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-semibold">Attendance Trends</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Class-wise attendance statistics</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Analyze daily attendance rates, identify chronic absentees, and view class comparisons.
                </p>
                <Link href="/attendance">
                  <Button variant="outline" className="w-full">
                    View Detailed Report
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="text-lg font-semibold">Academic Highlights</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-1">Assessment and grade summaries</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Track student performance across exams, quizzes, and overall class averages.
                </p>
                <Link href="/assessments">
                  <Button variant="outline" className="w-full">
                    View Detailed Report
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialReportsContent data={initialFinancialData} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceReportsContent data={initialAttendanceData} />
        </TabsContent>

        <TabsContent value="academic" className="space-y-4">
          <AcademicReportsContent data={initialAcademicData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
