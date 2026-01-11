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

export function TeacherForm() {
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
            full_name: "",
            email: "",
            phone: "",
            class_ids: [],
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = await createTeacher(values)

            if (result.success) {
                toast({
                    title: "Teacher Added",
                    description: "The teacher account has been created successfully.",
                })
                setOpen(false)
                form.reset()
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to create teacher.",
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
                <Button className="shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <Plus className="mr-2 h-4 w-4" /> Add Teacher
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Teacher</DialogTitle>
                    <DialogDescription>
                        Create a new teacher account. A temporary password will be assigned.
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
                                {loading ? "Creating..." : "Create Account"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
