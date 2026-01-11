'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { saveGrades } from '@/lib/actions/assessments';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { StudentForGrading, AssessmentWithClass } from '@/types/assessment.types';

interface GradeEntryFormProps {
    assessment: AssessmentWithClass;
    students: StudentForGrading[];
}

export function GradeEntryForm({ assessment, students }: GradeEntryFormProps) {
    const [grades, setGrades] = useState<Map<string, { score: number | null; remarks: string }>>(
        () => {
            const map = new Map();
            students.forEach((s) => {
                map.set(s.student_id, {
                    score: s.current_score ?? null,
                    remarks: s.current_remarks ?? '',
                });
            });
            return map;
        }
    );
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleScoreChange = (studentId: string, value: string) => {
        setGrades((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(studentId) || { score: null, remarks: '' };
            newMap.set(studentId, {
                ...current,
                score: value === '' ? null : Math.min(Number(value), assessment.max_score),
            });
            return newMap;
        });
        setMessage(null);
    };

    const handleRemarksChange = (studentId: string, value: string) => {
        setGrades((prev) => {
            const newMap = new Map(prev);
            const current = newMap.get(studentId) || { score: null, remarks: '' };
            newMap.set(studentId, { ...current, remarks: value });
            return newMap;
        });
        setMessage(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        const gradeInputs = Array.from(grades.entries()).map(([student_id, data]) => ({
            student_id,
            score: data.score,
            remarks: data.remarks,
        }));

        const result = await saveGrades({
            assessment_id: assessment.id,
            grades: gradeInputs,
        });

        if (result.success) {
            setMessage({ type: 'success', text: `Saved ${result.count} grades successfully!` });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save grades' });
        }

        setSaving(false);
    };

    const getGradeDisplay = (score: number | null) => {
        if (score === null) return '-';
        const percentage = (score / assessment.max_score) * 100;
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
    };

    const gradedCount = Array.from(grades.values()).filter((g) => g.score !== null).length;
    const averageScore =
        gradedCount > 0
            ? Array.from(grades.values())
                .filter((g) => g.score !== null)
                .reduce((sum, g) => sum + (g.score || 0), 0) / gradedCount
            : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/assessments">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{assessment.title}</h1>
                    <p className="text-muted-foreground">
                        {assessment.classes?.class_name} • {assessment.classes?.subject} •{' '}
                        {new Date(assessment.date).toLocaleDateString()}
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Grades'}
                </Button>
            </div>

            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Max Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{assessment.max_score}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Graded</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {gradedCount} / {students.length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {averageScore.toFixed(1)} ({((averageScore / assessment.max_score) * 100).toFixed(0)}%)
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`p-3 rounded-lg ${message.type === 'success'
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100'
                        }`}
                >
                    {message.text}
                </div>
            )}

            {/* Grade Entry Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Enter Grades</CardTitle>
                    <CardDescription>
                        Enter scores for each student (max: {assessment.max_score})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {students.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No students enrolled in this class
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Student Name</TableHead>
                                    <TableHead className="w-32">Score</TableHead>
                                    <TableHead>Grade</TableHead>
                                    <TableHead>Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student) => {
                                    const grade = grades.get(student.student_id);
                                    return (
                                        <TableRow key={student.student_id}>
                                            <TableCell className="font-mono">{student.student_code}</TableCell>
                                            <TableCell className="font-medium">{student.full_name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={assessment.max_score}
                                                    step="0.5"
                                                    value={grade?.score ?? ''}
                                                    onChange={(e) => handleScoreChange(student.student_id, e.target.value)}
                                                    className="w-24"
                                                    placeholder="-"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`font-bold ${grade && grade.score !== null
                                                        ? (grade.score / assessment.max_score) * 100 >= 60
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground'
                                                        : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    {getGradeDisplay(grade?.score ?? null)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    value={grade?.remarks || ''}
                                                    onChange={(e) => handleRemarksChange(student.student_id, e.target.value)}
                                                    placeholder="Optional remarks"
                                                    className="min-w-[200px]"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
