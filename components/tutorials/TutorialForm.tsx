'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tutorial, createTutorial, updateTutorial } from '@/lib/actions/tutorials';
import { Institute } from '@/lib/actions/institutes';
import { Loader2, Save } from 'lucide-react';

interface TutorialFormProps {
    tutorial?: Tutorial;
    classes: Array<{ id: string; class_name: string; class_code: string }>;
    institutes: Institute[];
}

export function TutorialForm({ tutorial, classes, institutes }: TutorialFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPublic, setIsPublic] = useState(tutorial?.is_public || false);
    const router = useRouter();
    const isEdit = !!tutorial;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        formData.set('is_public', isPublic.toString());

        const result = isEdit
            ? await updateTutorial(tutorial.id, formData)
            : await createTutorial(formData);

        setIsSubmitting(false);

        if (result.success) {
            router.push('/tutorials');
            router.refresh();
        } else {
            setError(result.error || 'Something went wrong');
        }
    };

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Tutorial' : 'Create New Tutorial'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="Enter tutorial title"
                            defaultValue={tutorial?.title}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="What will students learn from this tutorial?"
                            defaultValue={tutorial?.description ?? ''}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="content_type">Content Type</Label>
                            <Select name="content_type" defaultValue={tutorial?.content_type || 'video'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="document">Document</SelectItem>
                                    <SelectItem value="link">Link</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content_url">Content URL</Label>
                            <Input
                                id="content_url"
                                name="content_url"
                                type="url"
                                placeholder="https://..."
                                defaultValue={tutorial?.content_url ?? ''}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="class_id">Class (Optional)</Label>
                            <Select name="class_id" defaultValue={tutorial?.class_id ?? undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No specific class</SelectItem>
                                    {classes.map(cls => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.class_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="institute_id">Institute (Optional)</Label>
                            <Select name="institute_id" defaultValue={tutorial?.institute_id ?? undefined}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select institute" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No specific institute</SelectItem>
                                    {institutes.map(inst => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 py-2">
                        <Switch
                            id="is_public"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                        />
                        <Label htmlFor="is_public" className="cursor-pointer">
                            Make this tutorial public (visible to all students)
                        </Label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEdit ? 'Update Tutorial' : 'Create Tutorial'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
