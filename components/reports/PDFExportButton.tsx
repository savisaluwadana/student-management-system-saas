'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import type { FinancialReport, AttendanceReport, AcademicReport } from '@/lib/actions/reports';

interface PDFExportButtonProps {
  reportType: 'financial' | 'attendance' | 'academic';
  data: FinancialReport | AttendanceReport | AcademicReport;
  title: string;
}

export function PDFExportButton({ reportType, data, title }: PDFExportButtonProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with line wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      doc.text(text, margin, yPosition);
      yPosition += fontSize / 2 + 3;
    };

    // Add header
    doc.setFillColor(59, 130, 246); // Blue color
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    yPosition = 45;

    // Generate content based on report type
    if (reportType === 'financial') {
      generateFinancialPDF(doc, data as FinancialReport, addText, margin, pageWidth);
    } else if (reportType === 'attendance') {
      generateAttendancePDF(doc, data as AttendanceReport, addText, margin, pageWidth);
    } else if (reportType === 'academic') {
      generateAcademicPDF(doc, data as AcademicReport, addText, margin, pageWidth);
    }

    // Save the PDF
    const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  return (
    <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-2">
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  );
}

function generateFinancialPDF(
  doc: jsPDF,
  data: FinancialReport,
  addText: (text: string, fontSize?: number, isBold?: boolean) => void,
  margin: number,
  pageWidth: number
) {
  const { paymentStats, monthlyRevenue, defaulters, revenueByClass } = data;
  
  addText('Payment Statistics', 14, true);
  addText(`Total Revenue: LKR ${paymentStats.totalRevenue.toLocaleString()}`);
  addText(`Paid Amount: LKR ${paymentStats.paidAmount.toLocaleString()}`);
  addText(`Pending Amount: LKR ${paymentStats.pendingAmount.toLocaleString()}`);
  addText(`Overdue Amount: LKR ${paymentStats.overdueAmount.toLocaleString()}`);
  addText(`Total Payments: ${paymentStats.totalPayments}`);
  addText('');

  addText('Monthly Revenue (Last 6 Months)', 14, true);
  monthlyRevenue.slice(-6).forEach(month => {
    const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
    addText(`${monthName}: LKR ${month.revenue.toLocaleString()} (${month.payments} payments)`);
  });
  addText('');

  if (defaulters.length > 0) {
    addText('Top 10 Payment Defaulters', 14, true);
    defaulters.slice(0, 10).forEach((defaulter, index) => {
      addText(`${index + 1}. ${defaulter.student_name} (${defaulter.student_code})`);
      addText(`   Pending: LKR ${defaulter.total_pending.toLocaleString()}, Overdue: ${defaulter.overdue_count}`, 9);
    });
    addText('');
  }

  if (revenueByClass.length > 0) {
    addText('Top 10 Revenue by Class', 14, true);
    revenueByClass.slice(0, 10).forEach((cls, index) => {
      addText(`${index + 1}. ${cls.class_name}: LKR ${cls.revenue.toLocaleString()} (${cls.students} students)`);
    });
  }
}

function generateAttendancePDF(
  doc: jsPDF,
  data: AttendanceReport,
  addText: (text: string, fontSize?: number, isBold?: boolean) => void,
  margin: number,
  pageWidth: number
) {
  const { overallStats, dailyStats, classComparison, riskStudents } = data;

  addText('Overall Attendance Statistics', 14, true);
  addText(`Total Sessions: ${overallStats.totalSessions}`);
  addText(`Average Attendance Rate: ${overallStats.averageAttendanceRate.toFixed(1)}%`);
  addText(`Total Present: ${overallStats.totalPresent}`);
  addText(`Total Absent: ${overallStats.totalAbsent}`);
  addText(`Total Late: ${overallStats.totalLate}`);
  addText('');

  addText('Daily Attendance (Last 10 Days)', 14, true);
  dailyStats.slice(0, 10).forEach(day => {
    const date = new Date(day.date).toLocaleDateString();
    addText(`${date}: ${day.rate.toFixed(1)}% (P:${day.present} A:${day.absent} L:${day.late})`);
  });
  addText('');

  if (classComparison.length > 0) {
    addText('Class-wise Attendance Comparison', 14, true);
    classComparison.slice(0, 10).forEach((cls, index) => {
      addText(`${index + 1}. ${cls.class_name}: ${cls.average_attendance.toFixed(1)}% (${cls.total_sessions} sessions)`);
    });
    addText('');
  }

  if (riskStudents.length > 0) {
    addText('At-Risk Students (Attendance < 75%)', 14, true);
    riskStudents.slice(0, 10).forEach((student, index) => {
      addText(`${index + 1}. ${student.student_name} (${student.student_code})`);
      addText(`   Rate: ${student.attendance_rate.toFixed(1)}%, Absences: ${student.total_absences}`, 9);
    });
  }
}

function generateAcademicPDF(
  doc: jsPDF,
  data: AcademicReport,
  addText: (text: string, fontSize?: number, isBold?: boolean) => void,
  margin: number,
  pageWidth: number
) {
  const { assessmentStats, gradeDistribution, topPerformers, classPerformance } = data;

  addText('Assessment Statistics', 14, true);
  addText(`Total Assessments: ${assessmentStats.totalAssessments}`);
  addText(`Total Grades: ${assessmentStats.totalGrades}`);
  addText(`Average Score: ${assessmentStats.averageScore.toFixed(1)}%`);
  addText(`Highest Score: ${assessmentStats.highestScore.toFixed(1)}%`);
  addText(`Lowest Score: ${assessmentStats.lowestScore.toFixed(1)}%`);
  addText('');

  addText('Grade Distribution', 14, true);
  gradeDistribution.forEach(grade => {
    addText(`${grade.grade}: ${grade.count} students (${grade.percentage.toFixed(1)}%)`);
  });
  addText('');

  if (topPerformers.length > 0) {
    addText('Top 10 Performers', 14, true);
    topPerformers.forEach((student, index) => {
      addText(`${index + 1}. ${student.student_name} (${student.student_code})`);
      addText(`   Average: ${student.average_score.toFixed(1)}%, Assessments: ${student.assessments_taken}`, 9);
    });
    addText('');
  }

  if (classPerformance.length > 0) {
    addText('Class Performance', 14, true);
    classPerformance.slice(0, 10).forEach((cls, index) => {
      addText(`${index + 1}. ${cls.class_name}: ${cls.average_score.toFixed(1)}%`);
      addText(`   High: ${cls.highest_score.toFixed(0)}%, Low: ${cls.lowest_score.toFixed(0)}%, Students: ${cls.students_count}`, 9);
    });
  }
}
