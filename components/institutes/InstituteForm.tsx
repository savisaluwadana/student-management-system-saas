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
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
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
import { Institute, createInstitute, updateInstitute } from '@/lib/actions/institutes';
import { Loader2, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const instituteSchema = z.object({
    code: z.string().min(1, 'Institute code is required'),
    name: z.string().min(1, 'Institute name is required'),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']).default('active'),
});

interface InstituteFormProps {
    institute?: Institute;
}

export function InstituteForm({ institute }: InstituteFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const isEdit = !!institute;

    const form = useForm<z.infer<typeof instituteSchema>>({
        resolver: zodResolver(instituteSchema),
        defaultValues: {
            code: institute?.code || '',
            name: institute?.name || '',
            address: institute?.address || '',
            phone: institute?.phone || '',
            email: institute?.email || '',
            status: institute?.status || 'active',
        },
    });

    const handleSubmit = async (values: z.infer<typeof instituteSchema>) => {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('code', values.code);
        formData.append('name', values.name);
        if (values.address) formData.append('address', values.address);
        if (values.phone) formData.append('phone', values.phone);
        if (values.email) formData.append('email', values.email);
        formData.append('status', values.status);

        try {
            const result = isEdit
                ? await updateInstitute(institute!.id, formData)
                : await createInstitute(formData);

            if (result.success) {
                toast({
                    title: isEdit ? 'Institute Updated' : 'Institute Created',
                    description: isEdit ? 'Institute details have been updated.' : 'New institute has been created successfully.',
                });
                router.push('/institutes');
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
                <CardTitle>{isEdit ? 'Edit Institute' : 'Create New Institute'}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Institute Code *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., INST001" className="font-mono" {...field} />
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

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Institute Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter institute name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Enter full address" rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl>
                                            <Input type="tel" placeholder="+94 XX XXX XXXX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="institute@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                        {isEdit ? 'Update Institute' : 'Create Institute'}
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
