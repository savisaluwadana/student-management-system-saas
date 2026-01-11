"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createTeacher, updateTeacher } from "@/lib/actions/teachers"
import { toast } from "@/components/ui/use-toast"
import { getClasses } from "@/lib/actions/classes"
import { MultiSelect } from "@/components/ui/multi-select"
import { useEffect } from "react"

const formSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    phone: z.string().optional(),
    class_ids: z.array(z.string()).optional(),
})

import { Teacher } from "@/lib/actions/teachers"

interface TeacherFormProps {
    teacher?: Teacher;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function TeacherForm({ teacher, trigger, onSuccess }: TeacherFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<{ label: string; value: string }[]>([])

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                // Fetch all classes regardless of status, or maybe just active?
                // Let's fetch all for now, or active.
                const data = await getClasses();
                setClasses(data.map(c => ({ label: c.class_name, value: c.id })));
            } catch (error) {
                console.error("Failed to load classes", error);
            }
        };
        fetchClasses();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: teacher?.full_name || "",
            email: teacher?.email || "",
            phone: teacher?.phone || "",
            class_ids: teacher?.classes?.map(c => c.id) || [],
        },
    })

    // Update form when teacher prop changes
    useEffect(() => {
        if (teacher) {
            form.reset({
                full_name: teacher.full_name,
                email: teacher.email,
                phone: teacher.phone || "",
                class_ids: teacher.classes?.map(c => c.id) || [],
            });
        }
    }, [teacher, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = teacher
                ? await updateTeacher(teacher.id, values)
                : await createTeacher(values)

            if (result.success) {
                toast({
                    title: teacher ? "Teacher Updated" : "Teacher Added",
                    description: teacher ? "Teacher details have been updated." : "The teacher account has been created successfully.",
                })
                setOpen(false)
                if (!teacher) form.reset() // Only reset on create
                if (onSuccess) onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || (teacher ? "Failed to update teacher." : "Failed to create teacher."),
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong.",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <Plus className="mr-2 h-4 w-4" /> Add Teacher
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{teacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
                    <DialogDescription>
                        {teacher ? "Update teacher details and class assignments." : "Create a new teacher account. A temporary password will be assigned."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
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
                                        <Input placeholder="john@school.com" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+1 234 567 890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="class_ids"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assign Classes</FormLabel>
                                    <FormControl>
                                        <MultiSelect
                                            options={classes}
                                            selected={field.value || []}
                                            onChange={field.onChange}
                                            placeholder="Select classes to assign..."
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>
                                {loading ? (teacher ? "Updating..." : "Creating...") : (teacher ? "Save Changes" : "Create Account")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
