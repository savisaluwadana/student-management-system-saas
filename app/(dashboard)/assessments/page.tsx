import { getAssessments } from '@/lib/actions/assessments';
import { getClasses } from '@/lib/actions/classes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus, ClipboardList, Edit } from 'lucide-react';

const typeLabels: Record<string, string> = {
    exam: 'Exam',
    quiz: 'Quiz',
    assignment: 'Assignment',
    project: 'Project',
    midterm: 'Midterm',
    final: 'Final',
};

export default async function AssessmentsPage() {
    const [assessments, classes] = await Promise.all([
        getAssessments(),
        getClasses('active'),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Assessments</h1>
                    <p className="text-muted-foreground">Manage exams, quizzes, and assignments</p>
                </div>
                <Link href="/assessments/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Assessment
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Assessments</CardTitle>
                    <CardDescription>
                        Click on an assessment to enter grades
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {assessments.length === 0 ? (
                        <div className="text-center py-10">
                            <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No assessments created yet</p>
                            <Link href="/assessments/new">
                                <Button variant="link" className="mt-2">Create your first assessment</Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Max Score</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {assessments.map((assessment) => (
                                    <TableRow key={assessment.id}>
                                        <TableCell className="font-medium">{assessment.title}</TableCell>
                                        <TableCell>
                                            {assessment.classes?.class_name}
                                            <span className="text-muted-foreground ml-1">
                                                ({assessment.classes?.subject})
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {typeLabels[assessment.assessment_type] || assessment.assessment_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(assessment.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{assessment.max_score}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/assessments/${assessment.id}/grades`}>
                                                    <Button size="sm" variant="default">
                                                        Enter Grades
                                                    </Button>
                                                </Link>
                                                <Link href={`/assessments/${assessment.id}/edit`}>
                                                    <Button size="sm" variant="ghost">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
