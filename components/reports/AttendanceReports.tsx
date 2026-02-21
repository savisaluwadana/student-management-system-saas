'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PDFExportButton } from './PDFExportButton';
import type { AttendanceReport } from '@/lib/actions/reports';

interface AttendanceReportsProps {
  data: AttendanceReport;
}

export function AttendanceReportsContent({ data }: AttendanceReportsProps) {
  const { dailyStats, classComparison, riskStudents, overallStats } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <PDFExportButton reportType="attendance" data={data} title="Attendance Report" />
      </div>
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {overallStats.averageAttendanceRate.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <Progress value={overallStats.averageAttendanceRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Present</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {overallStats.totalPresent.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Absent</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  {overallStats.totalAbsent.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
                <p className="text-2xl font-bold mt-1 text-yellow-600">
                  {overallStats.totalLate.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Attendance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance Trend</CardTitle>
          <CardDescription>Last 30 days attendance statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dailyStats.slice(0, 10).map((day) => {
              const date = new Date(day.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                weekday: 'short'
              });

              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium w-32">{date}</span>
                    <div className="flex items-center gap-6 text-xs">
                      <span className="text-green-600">✓ {day.present}</span>
                      <span className="text-red-600">✗ {day.absent}</span>
                      <span className="text-yellow-600">⏰ {day.late}</span>
                      <span className="font-bold w-16 text-right">{day.rate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={day.rate} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Class-wise Comparison
            </CardTitle>
            <CardDescription>Attendance rates by class</CardDescription>
          </CardHeader>
          <CardContent>
            {classComparison.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No attendance data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classComparison.slice(0, 8).map((cls) => (
                  <div key={cls.class_name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cls.class_name}</span>
                      <span className="font-bold">{cls.average_attendance.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={cls.average_attendance} className="flex-1" />
                      <span className="text-xs text-muted-foreground w-24 text-right">
                        {cls.total_sessions} sessions
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* At-Risk Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              At-Risk Students
            </CardTitle>
            <CardDescription>Students with low attendance (&lt;75%)</CardDescription>
          </CardHeader>
          <CardContent>
            {riskStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-green-600 font-medium">All students have good attendance!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Absences</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskStudents.slice(0, 10).map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">{student.student_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{student.total_absences}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${
                          student.attendance_rate < 50 ? 'text-red-600' :
                          student.attendance_rate < 65 ? 'text-orange-600' :
                          'text-yellow-600'
                        }`}>
                          {student.attendance_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
