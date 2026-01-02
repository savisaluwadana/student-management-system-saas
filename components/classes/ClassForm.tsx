"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClass, updateClass } from "@/lib/actions/classes";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Class } from "@/types/class.types";
import { Textarea } from "@/components/ui/textarea";

const classSchema = z.object({
    class_code: z.string().min(2, "Class code must be at least 2 characters."),
    class_name: z.string().min(2, "Class name must be at least 2 characters."),
    subject: z.string().min(2, "Subject is required."),
    description: z.string().optional(),
    monthly_fee: z.string().refine((val) => !Number.isNaN(parseFloat(val)), {
        message: "Monthly fee must be a valid number",
    }).optional(),
    capacity: z.string().refine((val) => !Number.isNaN(parseInt(val)), {
        message: "Capacity must be a valid number",
    }).optional(),
    status: z.enum(["active", "inactive", "completed"]),
    schedule: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface ClassFormProps {
    initialData?: Class;
}

export function ClassForm({ initialData }: ClassFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const defaultValues: Partial<ClassFormValues> = initialData
        ? {
            class_code: initialData.class_code,
            class_name: initialData.class_name,
            subject: initialData.subject,
            description: initialData.description || "",
            monthly_fee: initialData.monthly_fee?.toString(),
            capacity: initialData.capacity?.toString(),
            status: initialData.status,
            schedule: initialData.schedule || "",
        }
        : {
            class_code: "",
            class_name: "",
            subject: "",
            description: "",
            monthly_fee: "",
            capacity: "",
            status: "active",
            schedule: "",
        };

    const form = useForm<ClassFormValues>({
        resolver: zodResolver(classSchema),
        defaultValues,
    });

    async function onSubmit(data: ClassFormValues) {
        setLoading(true);
        try {
            const payload = {
                ...data,
                monthly_fee: data.monthly_fee ? parseFloat(data.monthly_fee) : 0,
                capacity: data.capacity ? parseInt(data.capacity) : 0,
            };

            let result;
            if (initialData) {
                result = await updateClass(initialData.id, payload);
            } else {
                result = await createClass(payload);
            }

            if (result.success) {
                toast({
                    title: initialData ? "Class updated" : "Class created",
                    description: "The class has been saved successfully.",
                });
                router.push("/classes");
                router.refresh();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Something went wrong.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong.",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="class_code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. GRADE-10-A" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="class_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Class Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Grade 10 Science" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Science" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="capacity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Capacity</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 50" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="monthly_fee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monthly Fee</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="e.g. 1500" {...field} />
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
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="schedule"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Schedule</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Mon, Wed 10:00 AM - 12:00 PM" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Class description..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : initialData ? "Update Class" : "Create Class"}
                </Button>
            </form>
        </Form>
    );
}
