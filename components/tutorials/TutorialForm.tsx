"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Save } from "lucide-react"

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
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tutorial, createTutorial, updateTutorial } from "@/lib/actions/tutorials"
import { Institute } from "@/lib/actions/institutes"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const tutorialSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    content_type: z.enum(["video", "document", "link", "other"]),
    content_url: z.string().optional(),
    class_id: z.string().optional(),
    institute_id: z.string().optional(),
    is_public: z.boolean().default(false),
})

interface TutorialFormProps {
    tutorial?: Tutorial
    classes: Array<{ id: string; class_name: string; class_code: string }>
    institutes: Institute[]
}

export function TutorialForm({ tutorial, classes, institutes }: TutorialFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const isEdit = !!tutorial

    const form = useForm<z.infer<typeof tutorialSchema>>({
        resolver: zodResolver(tutorialSchema),
        defaultValues: {
            title: tutorial?.title || "",
            description: tutorial?.description || "",
            content_type: tutorial?.content_type || "video",
            content_url: tutorial?.content_url || "",
            class_id: tutorial?.class_id || "none", // Use "none" as sentinel for empty
            institute_id: tutorial?.institute_id || "none",
            is_public: tutorial?.is_public || false,
        },
    })

    async function onSubmit(values: z.infer<typeof tutorialSchema>) {
        setIsSubmitting(true)

        const formData = new FormData()
        formData.append("title", values.title)
        if (values.description) formData.append("description", values.description)
        formData.append("content_type", values.content_type)
        if (values.content_url) formData.append("content_url", values.content_url)

        // Handle "none" logic for optional selects
        if (values.class_id && values.class_id !== "none") {
            formData.append("class_id", values.class_id)
        }
        if (values.institute_id && values.institute_id !== "none") {
            formData.append("institute_id", values.institute_id)
        }

        formData.append("is_public", values.is_public.toString())

        try {
            const result = isEdit
                ? await updateTutorial(tutorial!.id, formData)
                : await createTutorial(formData)

            if (result.success) {
                toast({
                    title: isEdit ? "Tutorial Updated" : "Tutorial Created",
                    description: isEdit ? "The tutorial has been updated." : "The new tutorial has been created.",
                })
                router.push("/tutorials")
                router.refresh()
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to save tutorial.",
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card className="max-w-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-none shadow-xl ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader>
                <CardTitle>{isEdit ? "Edit Tutorial" : "Create New Tutorial"}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Title *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter tutorial title" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What will students learn from this tutorial?"
                                            rows={3}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="content_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="video">Video</SelectItem>
                                                <SelectItem value="document">Document</SelectItem>
                                                <SelectItem value="link">Link</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="content_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Content URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="class_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Class (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select class" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No specific class</SelectItem>
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.class_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="institute_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Institute (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select institute" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">No specific institute</SelectItem>
                                                {institutes.map((inst) => (
                                                    <SelectItem key={inst.id} value={inst.id}>
                                                        {inst.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="is_public"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Public Access</FormLabel>
                                        <FormDescription>
                                            Make this tutorial visible to all students
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
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
                                        {isEdit ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {isEdit ? "Update Tutorial" : "Create Tutorial"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
