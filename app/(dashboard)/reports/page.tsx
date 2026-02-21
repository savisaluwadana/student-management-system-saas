import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { getInstituteSummaries } from '@/lib/actions/institutes';
import { getFinancialReport, getAttendanceReport, getAcademicReport } from '@/lib/actions/reports';
import { FinancialReportsContent } from '@/components/reports/FinancialReports';
import { AttendanceReportsContent } from '@/components/reports/AttendanceReports';
import { AcademicReportsContent } from '@/components/reports/AcademicReports';
import { ExportReportsButton } from '@/components/reports/ExportReportsButton';

export default async function ReportsPage() {
    // Fetch data for the overview
    const stats = await getInstituteSummaries();
    
    // Fetch report data
    const financialData = await getFinancialReport();
    const attendanceData = await getAttendanceReport();
    const academicData = await getAcademicReport();

    // Quick calculations for the overview
    const totalStudents = stats.reduce((acc, inst) => acc + (inst.total_students || 0), 0);
    const totalClasses = stats.reduce((acc, inst) => acc + (inst.total_classes || 0), 0);

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
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportReportsButton 
                        reportType="all" 
                        data={{
                            financial: financialData,
                            attendance: attendanceData,
                            academic: academicData
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
                            <p className="text-2xl font-bold">{totalStudents}</p>
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
                            <p className="text-2xl font-bold">{totalClasses}</p>
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
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-indigo-400" />
                                    Financial Overview
                                </CardTitle>
                                <CardDescription>Monthly revenue and pending payments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    View detailed breakdown of fee collections, outstanding balances, and revenue projections.
                                </p>
                                <Link href="/payments">
                                    <Button variant="outline" className="w-full">View Detailed Report</Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-orange-400" />
                                    Attendance Trends
                                </CardTitle>
                                <CardDescription>Class-wise attendance statistics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Analyze daily attendance rates, identify chronic absentees, and view class comparisons.
                                </p>
                                <Link href="/attendance/reports">
                                    <Button variant="outline" className="w-full">View Detailed Report</Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all duration-300">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    Academic Highlights
                                </CardTitle>
                                <CardDescription>Assessment and grade summaries</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Track student performance across exams, quizzes, and overall class averages.
                                </p>
                                <Link href="/assessments">
                                    <Button variant="outline" className="w-full">View Detailed Report</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                    <FinancialReportsContent data={financialData} />
                </TabsContent>

                <TabsContent value="attendance" className="space-y-4">
                    <AttendanceReportsContent data={attendanceData} />
                </TabsContent>

                <TabsContent value="academic" className="space-y-4">
                    <AcademicReportsContent data={academicData} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
