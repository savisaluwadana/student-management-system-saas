'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, TrendingUp, FileText, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PDFExportButton } from './PDFExportButton';
import type { AcademicReport } from '@/lib/actions/reports';

interface AcademicReportsProps {
  data: AcademicReport;
}

export function AcademicReportsContent({ data }: AcademicReportsProps) {
  const { gradeDistribution, topPerformers, classPerformance, assessmentStats } = data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <PDFExportButton reportType="academic" data={data} title="Academic Performance Report" />
      </div>
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold mt-1">
                  {assessmentStats.averageScore.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Progress value={assessmentStats.averageScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assessments</p>
                <p className="text-2xl font-bold mt-1">
                  {assessmentStats.totalAssessments}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Highest Score</p>
                <p className="text-2xl font-bold mt-1 text-green-600">
                  {assessmentStats.highestScore.toFixed(1)}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Grades</p>
                <p className="text-2xl font-bold mt-1">
                  {assessmentStats.totalGrades}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
          <CardDescription>Percentage-based grade breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {gradeDistribution.map((grade) => {
              const gradeColors: Record<string, string> = {
                'A (90-100)': 'bg-green-500',
                'B (80-89)': 'bg-blue-500',
                'C (70-79)': 'bg-yellow-500',
                'D (60-69)': 'bg-orange-500',
                'F (0-59)': 'bg-red-500'
              };

              return (
                <div key={grade.grade} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium w-24">{grade.grade}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{grade.count} students</span>
                      <span className="font-bold w-16 text-right">{grade.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${gradeColors[grade.grade]} transition-all duration-500`}
                      style={{ width: `${grade.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Students with highest average scores</CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No performance data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Avg Score</TableHead>
                    <TableHead className="text-right">Assessments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPerformers.map((student, index) => (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-700' :
                          index === 1 ? 'bg-gray-400/20 text-gray-700' :
                          index === 2 ? 'bg-orange-500/20 text-orange-700' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">{student.student_code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-green-600">
                          {student.average_score.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{student.assessments_taken}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Class Performance
            </CardTitle>
            <CardDescription>Average scores by class</CardDescription>
          </CardHeader>
          <CardContent>
            {classPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No class performance data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classPerformance.slice(0, 8).map((cls) => (
                  <div key={cls.class_name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cls.class_name}</span>
                      <span className="font-bold">{cls.average_score.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={cls.average_score} className="flex-1" />
                      <span className="text-xs text-muted-foreground w-24 text-right">
                        {cls.students_count} students
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>High: {cls.highest_score.toFixed(0)}%</span>
                      <span>Low: {cls.lowest_score.toFixed(0)}%</span>
                      <span>{cls.assessments_count} assessments</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
