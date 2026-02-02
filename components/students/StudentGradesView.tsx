'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StudentClassGrade } from '@/types/assessment.types';
import { useMemo } from 'react';
import { BookOpen, GraduationCap, Calendar } from 'lucide-react';

interface StudentGradesViewProps {
    grades: StudentClassGrade[];
}

export function StudentGradesView({ grades }: StudentGradesViewProps) {
    // Group grades by class
    const gradesByClass = useMemo(() => {
        const grouped = new Map<string, {
            className: string;
            subject: string;
            grades: StudentClassGrade[];
        }>();

        grades.forEach((grade) => {
            if (!grouped.has(grade.class_id)) {
                grouped.set(grade.class_id, {
                    className: grade.class_name,
                    subject: grade.subject,
                    grades: [],
                });
            }
            grouped.get(grade.class_id)?.grades.push(grade);
        });

        return grouped;
    }, [grades]);

    if (grades.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mb-4 opacity-20" />
                    <p>No grades recorded for this student yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {Array.from(gradesByClass.entries()).map(([classId, data]) => {
                // Calculate class average
                const gradedAssessments = data.grades.filter(g => g.score !== null);
                const totalScore = gradedAssessments.reduce((sum, g) => sum + (g.percentage || 0), 0);
                const averagePercentage = gradedAssessments.length > 0
                    ? totalScore / gradedAssessments.length
                    : 0;

                return (
                    <Card key={classId} className="overflow-hidden">
                        <CardHeader className="bg-muted/40 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <CardTitle>{data.className}</CardTitle>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 ml-7">{data.subject}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Class Average</p>
                                    <p className={`text-2xl font-bold ${averagePercentage >= 75 ? 'text-green-600' :
                                            averagePercentage >= 50 ? 'text-yellow-600' :
                                                'text-red-600'
                                        }`}>
                                        {averagePercentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Assessment</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Score</TableHead>
                                        <TableHead className="text-right">Max</TableHead>
                                        <TableHead className="text-right">Percentage</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.grades.map((grade) => (
                                        <TableRow key={grade.assessment_id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(grade.assessment_date).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{grade.assessment_title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {grade.assessment_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {grade.score !== null ? grade.score : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {grade.max_score}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {grade.score !== null ? (
                                                    <Badge variant={
                                                        grade.percentage >= 75 ? 'default' : // Greenish usually if default is configured well, or use custom class
                                                            grade.percentage >= 50 ? 'secondary' :
                                                                'destructive'
                                                    } className={
                                                        grade.percentage >= 75 ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' :
                                                            grade.percentage >= 50 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200' :
                                                                ''
                                                    }>
                                                        {grade.percentage}%
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate text-muted-foreground" title={grade.remarks || ''}>
                                                {grade.remarks || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
