"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Mail, MessageSquare, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createCommunication } from "@/lib/actions/communications"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClasses } from "@/lib/actions/classes"
import { getStudents } from "@/lib/actions/students"
import { Class } from "@/types/class.types"
import { Student } from "@/types/student.types"

const formSchema = z.object({
    recipient_type: z.enum(["student", "class", "all"]),
    recipient_id: z.string().optional(),
    channel: z.enum(["email", "sms", "both"]),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(10, "Message must be at least 10 characters"),
}).superRefine((values, ctx) => {
    if (values.recipient_type !== 'all' && !values.recipient_id) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['recipient_id'],
            message: `Select a ${values.recipient_type}.`,
        })
    }
})

export function CommunicationForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [classes, setClasses] = useState<Class[]>([])
    const [students, setStudents] = useState<Student[]>([])

    useEffect(() => {
        const loadRecipients = async () => {
            try {
                const [classesData, studentsData] = await Promise.all([
                    getClasses('active'),
                    getStudents('active')
                ])
                setClasses(classesData)
                setStudents(studentsData)
            } catch (error) {
                console.error("Failed to load recipients", error)
                toast({
                    variant: "destructive",
                    title: "Could not load recipients",
                    description: "Refresh the page and try again.",
                })
            }
        }
        loadRecipients()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            recipient_type: "all",
            recipient_id: undefined,
            channel: "email",
            subject: "",
            message: "",
        },
    })

    const recipientType = form.watch("recipient_type")

    useEffect(() => {
        form.setValue('recipient_id', undefined)
    }, [recipientType, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            const result = await createCommunication({
                recipient_type: values.recipient_type,
                recipient_id: values.recipient_id || null,
                channel: values.channel,
                subject: values.subject,
                message: values.message,
            })

            if (result.success) {
                toast({
                    title: "Message queued",
                    description: "The communication has been saved as pending for delivery.",
                })
                form.reset({
                    recipient_type: 'all',
                    recipient_id: undefined,
                    channel: 'email',
                    subject: '',
                    message: '',
                })
            } else {
                toast({
                    variant: "destructive",
                    title: "Could not queue message",
                    description: result.error || "Failed to save the communication.",
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Could not queue message",
                description: "Something went wrong.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    New message
                </CardTitle>
                <CardDescription>
                    Prepare an email or SMS communication for delivery.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="channel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Channel</FormLabel>
                                        <FormControl>
                                            <Tabs
                                                onValueChange={field.onChange}
                                                value={field.value}
                                                className="w-full"
                                            >
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="email" className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4" /> Email
                                                    </TabsTrigger>
                                                    <TabsTrigger value="sms" className="flex items-center gap-2">
                                                        <MessageSquare className="h-4 w-4" /> SMS
                                                    </TabsTrigger>
                                                    <TabsTrigger value="both">Both</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="recipient_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recipient</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select who to send to" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="all">All Students</SelectItem>
                                                <SelectItem value="class">Specific Class</SelectItem>
                                                <SelectItem value="student">Specific Student</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {recipientType === 'all' && "Queue this for all active students."}
                                            {recipientType === 'class' && "Select a class to target."}
                                            {recipientType === 'student' && "Select a specific student."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {recipientType === 'class' && (
                            <FormField
                                control={form.control}
                                name="recipient_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {classes.map((classItem) => (
                                                    <SelectItem key={classItem.id} value={classItem.id}>
                                                        {classItem.class_name} ({classItem.class_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {recipientType === 'student' && (
                            <FormField
                                control={form.control}
                                name="recipient_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Student</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a student" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {students.map((student) => (
                                                    <SelectItem key={student.id} value={student.id}>
                                                        {student.full_name} ({student.student_code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Announcement title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Type your message here..."
                                            className="min-h-[120px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Queuing...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Queue message
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
