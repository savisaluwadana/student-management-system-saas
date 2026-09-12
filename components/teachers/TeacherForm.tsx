"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Check, Copy, Plus, Send } from "lucide-react"

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
import { createTeacher, updateTeacher, type Teacher } from "@/lib/actions/teachers"
import { toast } from "@/components/ui/use-toast"
import { getClasses } from "@/lib/actions/classes"
import { MultiSelect } from "@/components/ui/multi-select"

const formSchema = z.object({
    full_name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.string().email("Invalid email address."),
    phone: z.string().optional(),
    class_ids: z.array(z.string()).optional(),
})

interface TeacherFormProps {
    teacher?: Teacher;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function TeacherForm({ teacher, trigger, onSuccess }: TeacherFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<{ label: string; value: string }[]>([])
    const [inviteUrl, setInviteUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await getClasses()
                setClasses(data.map((classItem) => ({ label: classItem.class_name, value: classItem.id })))
            } catch (error) {
                console.error("Failed to load classes", error)
            }
        }
        if (open) fetchClasses()
    }, [open])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: teacher?.full_name || "",
            email: teacher?.email || "",
            phone: teacher?.phone || "",
            class_ids: teacher?.classes?.map((classItem) => classItem.id) || [],
        },
    })

    useEffect(() => {
        if (teacher) {
            form.reset({
                full_name: teacher.full_name,
                email: teacher.email,
                phone: teacher.phone || "",
                class_ids: teacher.classes?.map((classItem) => classItem.id) || [],
            })
        }
    }, [teacher, form])

    useEffect(() => {
        if (!open) {
            setInviteUrl(null)
            setCopied(false)
            if (!teacher) form.reset()
        }
    }, [open, teacher, form])

    const copyInvite = async () => {
        if (!inviteUrl) return
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            toast({ title: "Invite link copied" })
            window.setTimeout(() => setCopied(false), 1800)
        } catch {
            toast({
                variant: "destructive",
                title: "Could not copy automatically",
                description: "Select the invitation link and copy it manually.",
            })
        }
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = teacher
                ? await updateTeacher(teacher.id, values)
                : await createTeacher(values)

            if (!result.success) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || (teacher ? "Failed to update teacher." : "Failed to create invitation."),
                })
                return
            }

            if (teacher) {
                toast({
                    title: "Teacher updated",
                    description: "Teacher details and class assignments have been saved.",
                })
                setOpen(false)
                onSuccess?.()
                return
            }

            if (result.invite_url) {
                setInviteUrl(result.invite_url)
                try {
                    await navigator.clipboard.writeText(result.invite_url)
                    setCopied(true)
                } catch {
                    setCopied(false)
                }
                toast({
                    title: "Invitation ready",
                    description: "Share the one-time link with the teacher. It expires in 7 days.",
                })
                onSuccess?.()
            }
        } catch {
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
                        <Plus className="mr-2 h-4 w-4" /> Invite Teacher
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                {inviteUrl && !teacher ? (
                    <>
                        <DialogHeader>
                            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                                <Check className="h-5 w-5" />
                            </div>
                            <DialogTitle>Invitation ready</DialogTitle>
                            <DialogDescription>
                                Send this private link to the teacher. They will choose their own password before joining the workspace. The link expires in 7 days.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3">
                            <div className="rounded-xl border bg-muted/30 p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">One-time invitation link</p>
                                <div className="flex gap-2">
                                    <Input value={inviteUrl} readOnly className="h-10 text-xs" onFocus={(event) => event.currentTarget.select()} />
                                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={copyInvite}>
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Academix stores only a hash of the invite token. Anyone without this exact URL cannot use the invitation.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" onClick={() => setOpen(false)}>Done</Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>{teacher ? "Edit Teacher" : "Invite a Teacher"}</DialogTitle>
                            <DialogDescription>
                                {teacher
                                    ? "Update teacher details and class assignments."
                                    : "Create a secure workspace invitation. No shared temporary password is created."}
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
                                                <Input placeholder="+94 77 123 4567" {...field} />
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
                                        {loading
                                            ? (teacher ? "Updating..." : "Creating invitation...")
                                            : teacher
                                                ? "Save Changes"
                                                : <><Send className="mr-2 h-4 w-4" />Create Invite</>}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
