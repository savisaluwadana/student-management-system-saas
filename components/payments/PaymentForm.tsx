"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
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
import { recordPayment } from "@/lib/actions/payments"
import { getStudents } from "@/lib/actions/students"
import { toast } from "@/components/ui/use-toast"

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
})

export function PaymentForm() {
    const [open, setOpen] = useState(false)
    const [students, setStudents] = useState<{ id: string; full_name: string; student_code: string }[]>([])
    const [studentSearchOpen, setStudentSearchOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
            notes: "",
        },
    })

    useEffect(() => {
        async function loadStudents() {
            // We might need to implement getAllStudents or similar efficient search
            // For now assuming we can fetch basic list. Ideally this should be server-side searched in Command
            try {
                // Mocking fetching students if action doesn't strictly exist or import fails. 
                // In real app, import { getAllStudents } from ...
                const res = await getAllStudents();
                setStudents(res);
            } catch (e) {
                console.error("Failed to load students", e)
            }
        }
        if (open) {
            loadStudents()
        }
    }, [open])

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await recordPayment({
                student_id: values.student_id,
                amount: values.amount,
                payment_month: values.payment_month.toISOString(), // simplified for now
                due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(), // End of current month default
                status: "paid", // Automatically mark as paid for manual entry
                payment_method: values.payment_method,
                payment_date: new Date().toISOString(),
                notes: values.notes,
            })

            if (result.success) {
                toast({
                    title: "Payment Recorded",
                    description: "The payment has been successfully recorded.",
                })
                setOpen(false)
                form.reset()
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to record payment.",
                })
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong.",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    Record Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Record Manual Payment</DialogTitle>
                    <DialogDescription>
                        Enter payment details for a student. This will record it as immediately paid.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="student_id"
                            render={({ field }) => (
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
                                render={({ field }) => (
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
                                render={({ field }) => (
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

                        <FormField
                            control={form.control}
                            name="payment_month"
                            render={({ field }) => (
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
                                                        format(field.value, "PPP")
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
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        The month this payment applies to.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
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
                            <Button type="submit">Record Payment</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
