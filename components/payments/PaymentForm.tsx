"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
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
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { recordPayment, updatePayment } from "@/lib/actions/payments"
import { getStudents } from "@/lib/actions/students"
import { toast } from "@/components/ui/use-toast"
import { FeePayment } from "@/types/payment.types"

const formSchema = z.object({
    student_id: z.string({
        required_error: "Please select a student.",
    }),
    amount: z.coerce.number().min(1, "Amount must be greater than 0."),
    payment_month: z.date({
        required_error: "Payment month is required.",
    }),
    payment_method: z.string({
        required_error: "Please select a payment method.",
    }),
    notes: z.string().optional(),
    status: z.string().optional(),
})

interface PaymentFormProps {
    payment?: any; // Using any for now as the type from action might differ slightly from FeePayment
    trigger?: React.ReactNode;
}

export function PaymentForm({ payment, trigger }: PaymentFormProps) {
    const [open, setOpen] = useState(false)
    const [students, setStudents] = useState<{ id: string; full_name: string; student_code: string }[]>([])
    const [studentSearchOpen, setStudentSearchOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isEdit = !!payment

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            student_id: payment?.student_id || "",
            amount: payment?.amount || 0,
            payment_month: payment?.payment_month ? new Date(payment.payment_month) : new Date(),
            payment_method: payment?.payment_method || "",
            notes: payment?.notes || "",
            status: payment?.status || "paid",
        },
    })

    useEffect(() => {
        async function loadStudents() {
            try {
                const res = await getStudents();
                setStudents(res);
            } catch (e) {
                console.error("Failed to load students", e)
            }
        }
        if (open) {
            loadStudents()
        }
    }, [open])

    // Reset form when payment prop changes
    useEffect(() => {
        if (payment) {
            form.reset({
                student_id: payment.student_id,
                amount: payment.amount,
                payment_month: new Date(payment.payment_month),
                payment_method: payment.payment_method || "",
                notes: payment.notes || "",
                status: payment.status || "paid",
            })
        }
    }, [payment, form])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            let result;

            if (isEdit) {
                result = await updatePayment(payment.id, {
                    student_id: values.student_id,
                    amount: values.amount,
                    payment_month: values.payment_month.toISOString(),
                    payment_method: values.payment_method as any,
                    status: values.status as any,
                    notes: values.notes,
                })
            } else {
                result = await recordPayment({
                    student_id: values.student_id,
                    amount: values.amount,
                    payment_month: values.payment_month.toISOString(),
                    due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
                    status: "paid",
                    payment_method: values.payment_method as any,
                    payment_date: new Date().toISOString(),
                    notes: values.notes,
                })
            }

            if (result.success) {
                toast({
                    title: isEdit ? "Payment Updated" : "Payment Recorded",
                    description: isEdit ? "The payment details have been updated." : "The payment has been successfully recorded.",
                })
                setOpen(false)
                if (!isEdit) form.reset()
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to save payment.",
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        Record Payment
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Payment" : "Record Manual Payment"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update payment details." : "Enter payment details for a student."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="student_id"
                            render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Student</FormLabel>
                                    <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={studentSearchOpen}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    disabled={isEdit} // Disable student selection on edit to prevent accidental swaps
                                                >
                                                    {field.value
                                                        ? students.find((student) => student.id === field.value)?.full_name
                                                        : "Select student..."}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search student..." />
                                                <CommandEmpty>No student found.</CommandEmpty>
                                                <CommandList>
                                                    <CommandGroup>
                                                        {students.map((student) => (
                                                            <CommandItem
                                                                value={student.full_name}
                                                                key={student.id}
                                                                onSelect={() => {
                                                                    form.setValue("student_id", student.id)
                                                                    setStudentSearchOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        student.id === field.value ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {student.full_name} ({student.student_code})
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Amount</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payment_method"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Method</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="card">Card</SelectItem>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="online">Online</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
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
                                name="payment_month"
                                render={({ field }: { field: any }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Payment Month</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "MMM yyyy")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date: Date) =>
                                                        date > new Date(new Date().setFullYear(new Date().getFullYear() + 1)) || date < new Date("1900-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {isEdit && (
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }: { field: any }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="paid">Paid</SelectItem>
                                                    <SelectItem value="unpaid">Unpaid</SelectItem>
                                                    <SelectItem value="overdue">Overdue</SelectItem>
                                                    <SelectItem value="partial">Partial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>Notes (Optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? "Update Payment" : "Record Payment"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
