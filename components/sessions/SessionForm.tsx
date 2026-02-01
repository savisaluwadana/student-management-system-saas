'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Session, createSession, updateSession } from '@/lib/actions/sessions';
import { Loader2, Save } from 'lucide-react';

interface SessionFormProps {
    session?: Session;
    classes: Array<{ id: string; class_name: string; class_code: string }>;
}

const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
];

export function SessionForm({ session, classes }: SessionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>(session?.days_of_week || []);
    const router = useRouter();
    const isEdit = !!session;

    const handleDayToggle = (day: string, checked: boolean) => {
        if (checked) {
            setSelectedDays(prev => [...prev, day]);
        } else {
            setSelectedDays(prev => prev.filter(d => d !== day));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // Clear existing days_of_week and add selected ones
        formData.delete('days_of_week');
        selectedDays.forEach(day => formData.append('days_of_week', day));

        const result = isEdit
            ? await updateSession(session.id, formData)
            : await createSession(formData);

        setIsSubmitting(false);

        if (result.success) {
            router.push('/sessions');
            router.refresh();
        } else {
            setError(result.error || 'Something went wrong');
        }
    };

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Session' : 'Create New Session'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="class_id">Class *</Label>
                        <Select name="class_id" defaultValue={session?.class_id} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map(cls => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.class_name} ({cls.class_code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Session Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Morning Session"
                                defaultValue={session?.name}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" defaultValue={session?.status || 'active'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Start Time *</Label>
                            <Input
                                id="start_time"
                                name="start_time"
                                type="time"
                                defaultValue={session?.start_time}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">End Time *</Label>
                            <Input
                                id="end_time"
                                name="end_time"
                                type="time"
                                defaultValue={session?.end_time}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Days of Week *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {daysOfWeek.map(day => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={day.value}
                                        checked={selectedDays.includes(day.value)}
                                        onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
                                    />
                                    <Label htmlFor={day.value} className="text-sm font-normal cursor-pointer">
                                        {day.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
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
                        <Button type="submit" disabled={isSubmitting || selectedDays.length === 0} className="gap-2">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEdit ? 'Update Session' : 'Create Session'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
