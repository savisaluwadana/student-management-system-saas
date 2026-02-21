'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportReportsButtonProps {
  reportType: 'financial' | 'attendance' | 'academic' | 'all';
  data: any;
}

export function ExportReportsButton({ reportType, data }: ExportReportsButtonProps) {
  const handleExport = () => {
    // Generate CSV content based on report type
    let csvContent = '';
    let filename = '';

    switch (reportType) {
      case 'financial':
        csvContent = generateFinancialCSV(data);
        filename = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'attendance':
        csvContent = generateAttendanceCSV(data);
        filename = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'academic':
        csvContent = generateAcademicCSV(data);
        filename = `academic-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'all':
        // For 'all', we'll create a combined report or trigger multiple downloads
        csvContent = generateCombinedCSV(data);
        filename = `complete-report-${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Export {reportType === 'all' ? 'All Reports' : 'Report'}
    </Button>
  );
}

function generateFinancialCSV(data: any): string {
  let csv = 'Financial Report\n\n';
  
  // Payment Stats
  csv += 'Payment Statistics\n';
  csv += 'Metric,Amount (LKR)\n';
  csv += `Total Revenue,${data.paymentStats.totalRevenue}\n`;
  csv += `Paid Amount,${data.paymentStats.paidAmount}\n`;
  csv += `Pending Amount,${data.paymentStats.pendingAmount}\n`;
  csv += `Overdue Amount,${data.paymentStats.overdueAmount}\n`;
  csv += `Total Payments,${data.paymentStats.totalPayments}\n\n`;

  // Monthly Revenue
  csv += 'Monthly Revenue\n';
  csv += 'Month,Revenue (LKR),Number of Payments\n';
  data.monthlyRevenue.forEach((month: any) => {
    csv += `${month.month},${month.revenue},${month.payments}\n`;
  });
  csv += '\n';

  // Defaulters
  csv += 'Payment Defaulters\n';
  csv += 'Student Name,Student Code,Pending Amount (LKR),Overdue Count\n';
  data.defaulters.forEach((defaulter: any) => {
    csv += `${defaulter.student_name},${defaulter.student_code},${defaulter.total_pending},${defaulter.overdue_count}\n`;
  });
  csv += '\n';

  // Revenue by Class
  csv += 'Revenue by Class\n';
  csv += 'Class Name,Revenue (LKR),Number of Students\n';
  data.revenueByClass.forEach((cls: any) => {
    csv += `${cls.class_name},${cls.revenue},${cls.students}\n`;
  });

  return csv;
}

function generateAttendanceCSV(data: any): string {
  let csv = 'Attendance Report\n\n';
  
  // Overall Stats
  csv += 'Overall Statistics\n';
  csv += 'Metric,Value\n';
  csv += `Total Sessions,${data.overallStats.totalSessions}\n`;
  csv += `Average Attendance Rate,${data.overallStats.averageAttendanceRate.toFixed(2)}%\n`;
  csv += `Total Present,${data.overallStats.totalPresent}\n`;
  csv += `Total Absent,${data.overallStats.totalAbsent}\n`;
  csv += `Total Late,${data.overallStats.totalLate}\n\n`;

  // Daily Stats
  csv += 'Daily Attendance Statistics\n';
  csv += 'Date,Present,Absent,Late,Total,Attendance Rate (%)\n';
  data.dailyStats.forEach((day: any) => {
    csv += `${day.date},${day.present},${day.absent},${day.late},${day.total},${day.rate.toFixed(2)}\n`;
  });
  csv += '\n';

  // Class Comparison
  csv += 'Class-wise Attendance Comparison\n';
  csv += 'Class Name,Total Sessions,Average Attendance (%),Present Count,Absent Count\n';
  data.classComparison.forEach((cls: any) => {
    csv += `${cls.class_name},${cls.total_sessions},${cls.average_attendance.toFixed(2)},${cls.present_count},${cls.absent_count}\n`;
  });
  csv += '\n';

  // At-Risk Students
  csv += 'At-Risk Students (Attendance < 75%)\n';
  csv += 'Student Name,Student Code,Total Absences,Attendance Rate (%),Classes Enrolled\n';
  data.riskStudents.forEach((student: any) => {
    csv += `${student.student_name},${student.student_code},${student.total_absences},${student.attendance_rate.toFixed(2)},${student.classes_enrolled}\n`;
  });

  return csv;
}

function generateAcademicCSV(data: any): string {
  let csv = 'Academic Performance Report\n\n';
  
  // Assessment Stats
  csv += 'Assessment Statistics\n';
  csv += 'Metric,Value\n';
  csv += `Total Assessments,${data.assessmentStats.totalAssessments}\n`;
  csv += `Total Grades,${data.assessmentStats.totalGrades}\n`;
  csv += `Average Score,${data.assessmentStats.averageScore.toFixed(2)}%\n`;
  csv += `Highest Score,${data.assessmentStats.highestScore.toFixed(2)}%\n`;
  csv += `Lowest Score,${data.assessmentStats.lowestScore.toFixed(2)}%\n\n`;

  // Grade Distribution
  csv += 'Grade Distribution\n';
  csv += 'Grade,Count,Percentage\n';
  data.gradeDistribution.forEach((grade: any) => {
    csv += `${grade.grade},${grade.count},${grade.percentage.toFixed(2)}%\n`;
  });
  csv += '\n';

  // Top Performers
  csv += 'Top Performers\n';
  csv += 'Rank,Student Name,Student Code,Average Score (%),Assessments Taken\n';
  data.topPerformers.forEach((student: any, index: number) => {
    csv += `${index + 1},${student.student_name},${student.student_code},${student.average_score.toFixed(2)},${student.assessments_taken}\n`;
  });
  csv += '\n';

  // Class Performance
  csv += 'Class Performance\n';
  csv += 'Class Name,Average Score (%),Assessments Count,Students Count,Highest Score (%),Lowest Score (%)\n';
  data.classPerformance.forEach((cls: any) => {
    csv += `${cls.class_name},${cls.average_score.toFixed(2)},${cls.assessments_count},${cls.students_count},${cls.highest_score.toFixed(2)},${cls.lowest_score.toFixed(2)}\n`;
  });

  return csv;
}

function generateCombinedCSV(data: any): string {
  let csv = 'Complete Institute Report\n';
  csv += `Generated on: ${new Date().toLocaleString()}\n\n`;
  csv += '=' .repeat(80) + '\n\n';
  
  csv += generateFinancialCSV(data.financial);
  csv += '\n' + '='.repeat(80) + '\n\n';
  
  csv += generateAttendanceCSV(data.attendance);
  csv += '\n' + '='.repeat(80) + '\n\n';
  
  csv += generateAcademicCSV(data.academic);
  
  return csv;
}
