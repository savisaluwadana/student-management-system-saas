'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Session, createSession, updateSession } from '@/lib/actions/sessions';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const sessionSchema = z.object({
    class_id: z.string().min(1, 'Class is required'),
    name: z.string().min(1, 'Session name is required'),
    start_time: z.string().min(1, 'Start time is required'),
    end_time: z.string().min(1, 'End time is required'),
    days_of_week: z.array(z.string()).min(1, 'Select at least one day'),
    status: z.enum(['active', 'inactive']).default('active'),
});

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
    const router = useRouter();
    const isEdit = !!session;

    const form = useForm<z.infer<typeof sessionSchema>>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            class_id: session?.class_id || '',
            name: session?.name || '',
            start_time: session?.start_time || '',
            end_time: session?.end_time || '',
            days_of_week: session?.days_of_week || [],
            status: session?.status || 'active',
        },
    });

    const handleSubmit = async (values: z.infer<typeof sessionSchema>) => {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('class_id', values.class_id);
        formData.append('name', values.name);
        formData.append('start_time', values.start_time);
        formData.append('end_time', values.end_time);
        formData.append('status', values.status);

        values.days_of_week.forEach(day => formData.append('days_of_week', day));

        try {
            const result = isEdit
                ? await updateSession(session!.id, formData)
                : await createSession(formData);

            if (result.success) {
                toast({
                    title: isEdit ? 'Session Updated' : 'Session Created',
                    description: isEdit ? 'Session details have been updated.' : 'New session has been created successfully.',
                });
                router.push('/sessions');
                router.refresh();
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.error || 'Something went wrong',
                });
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'An unexpected error occurred.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-none shadow-xl ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
                <CardTitle>{isEdit ? 'Edit Session' : 'Create New Session'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="class_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Class *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a class" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {classes.map(cls => (
                                                <SelectItem key={cls.id} value={cls.id}>
                                                    {cls.class_name} ({cls.class_code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Session Name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Morning Session" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Time *</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="end_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Time *</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="days_of_week"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Days of Week *</FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {daysOfWeek.map((day) => (
                                            <FormField
                                                key={day.value}
                                                control={form.control}
                                                name="days_of_week"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={day.value}
                                                            className="flex flex-row items-center space-x-2 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(day.value)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, day.value])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== day.value
                                                                                )
                                                                            )
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer">
                                                                {day.label}
                                                            </FormLabel>
                                                        </FormItem>
                                                    )
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                        {isEdit ? 'Update Session' : 'Create Session'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
