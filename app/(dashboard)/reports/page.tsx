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
import { ReportsPageClient } from '@/components/reports/ReportsPageClient';

export default async function ReportsPage({
    searchParams
}: {
    searchParams: { startDate?: string; endDate?: string }
}) {
    const { startDate, endDate } = searchParams;
    const { startDate, endDate } = searchParams;
    
    // Fetch data for the overview
    const stats = await getInstituteSummaries();
    
    // Fetch report data with date filters
    const financialData = await getFinancialReport(startDate, endDate);
    const attendanceData = await getAttendanceReport(startDate, endDate);
    const academicData = await getAcademicReport(startDate, endDate);

    // Quick calculations for the overview
    const totalStudents = stats.reduce((acc, inst) => acc + (inst.total_students || 0), 0);
    const totalClasses = stats.reduce((acc, inst) => acc + (inst.total_classes || 0), 0);

    return (
        <ReportsPageClient 
            initialStats={{ totalStudents, totalClasses }}
            initialFinancialData={financialData}
            initialAttendanceData={attendanceData}
            initialAcademicData={academicData}
            startDate={startDate}
            endDate={endDate}
        />
    );
}
