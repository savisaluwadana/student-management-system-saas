'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAssessmentById, updateAssessment } from '@/lib/actions/assessments';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Class {
    id: string;
    class_code: string;
    class_name: string;
    subject: string;
}

export default function EditAssessmentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assessment, setAssessment] = useState<any>(null);

    const [classes, setClasses] = useState<Class[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch assessment
                const assessmentData = await getAssessmentById(params.id);
                if (assessmentData) {
                    setAssessment(assessmentData);
                }

                // Fetch classes
                fetch('/api/classes')
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setClasses(data);
                        }
                    });

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load assessment');
                setLoading(false);
            }
        };
        loadData();
    }, [params.id]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const result = await updateAssessment(params.id, {
            title: formData.get('title') as string,
            description: formData.get('description') as string || undefined,
            assessment_type: formData.get('assessment_type') as any,
            max_score: Number(formData.get('max_score')) || 100,
            weight: Number(formData.get('weight')) || 1,
            date: formData.get('date') as string,
        });

        if (result.success) {
            router.push('/assessments');
            router.refresh();
        } else {
            setError(result.error || 'Failed to update assessment');
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading assessment...</div>;
    }

    if (!assessment) {
        return <div className="p-8 text-center text-zinc-800">Assessment not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/assessments">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Edit Assessment</h1>
                    <p className="text-muted-foreground">Update exam, quiz, or assignment details</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assessment Details</CardTitle>
                    <CardDescription>
                        Modify the information for this assessment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={assessment.title}
                                    placeholder="e.g. Mid-term Examination"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="class_id">Class</Label>
                                {/* We keep class disabled during edit to prevent grading mismatch normally, but we can display it */}
                                <Input
                                    disabled
                                    value={assessment.classes?.class_name + ' (' + assessment.classes?.subject + ')'}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assessment_type">Type *</Label>
                                <Select name="assessment_type" defaultValue={assessment.assessment_type} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="exam">Exam</SelectItem>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                        <SelectItem value="assignment">Assignment</SelectItem>
                                        <SelectItem value="project">Project</SelectItem>
                                        <SelectItem value="midterm">Midterm</SelectItem>
                                        <SelectItem value="final">Final</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={new Date(assessment.date).toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_score">Max Score</Label>
                                <Input
                                    id="max_score"
                                    name="max_score"
                                    type="number"
                                    min="1"
                                    defaultValue={assessment.max_score}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight</Label>
                                <Input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    defaultValue={assessment.weight}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    defaultValue={assessment.description || ''}
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-zinc-800">{error}</p>
                        )}

                        <div className="flex justify-end gap-4">
                            <Link href="/assessments">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Update Assessment'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
