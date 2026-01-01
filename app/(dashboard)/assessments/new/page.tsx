'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAssessment } from '@/lib/actions/assessments';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Class {
    id: string;
    class_code: string;
    class_name: string;
    subject: string;
}

export default function NewAssessmentPage() {
    // This needs to be a client component for interactivity, but we need classes
    // In a real app, you'd fetch this or pass it as props
    return <NewAssessmentForm />;
}

function NewAssessmentForm() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch classes client-side or use a wrapper
    const [classes, setClasses] = useState<Class[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load classes on mount
    useState(() => {
        fetch('/api/classes')
            .then(res => res.json())
            .then(data => {
                setClasses(data || []);
                setLoaded(true);
            })
            .catch(() => setLoaded(true));
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const result = await createAssessment({
            class_id: formData.get('class_id') as string,
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
            setError(result.error || 'Failed to create assessment');
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/assessments">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Create Assessment</h1>
                    <p className="text-muted-foreground">Add a new exam, quiz, or assignment</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assessment Details</CardTitle>
                    <CardDescription>
                        Fill in the information for the new assessment
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
                                    placeholder="e.g. Mid-term Examination"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="class_id">Class *</Label>
                                <Select name="class_id" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>
                                                {cls.class_name} ({cls.subject})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="assessment_type">Type *</Label>
                                <Select name="assessment_type" required>
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
                                    defaultValue="100"
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
                                    defaultValue="1"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    name="description"
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}

                        <div className="flex justify-end gap-4">
                            <Link href="/assessments">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Creating...' : 'Create Assessment'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
