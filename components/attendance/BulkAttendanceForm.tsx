'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { markBulkAttendance, getEnrolledStudentsWithAttendance } from '@/lib/actions/attendance';
import { Institute } from '@/lib/actions/institutes';
import { Loader2, CheckCircle2, XCircle, Clock, UserCheck, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkAttendanceFormProps {
    classes: Array<{ id: string; class_name: string; class_code: string; enrollment_count: number }>;
    institutes: Institute[];
}

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendance {
    student_id: string;
    student_code: string;
    full_name: string;
    status: AttendanceStatus;
    currentStatus?: string;
}

export function BulkAttendanceForm({ classes, institutes }: BulkAttendanceFormProps) {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedInstitute, setSelectedInstitute] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [success, setSuccess] = useState<string | null>(null);
    const router = useRouter();

    // Filter classes by institute
    const filteredClasses = selectedInstitute
        ? classes // TODO: Filter when institute_id is added to classes
        : classes;

    // Load students when class is selected
    useEffect(() => {
        if (!selectedClass || !date) {
            setStudents([]);
            return;
        }

        setIsLoading(true);
        getEnrolledStudentsWithAttendance(selectedClass, date)
            .then((data) => {
                setStudents(
                    data.map((s: any) => ({
                        student_id: s.student_id,
                        student_code: s.student_code,
                        full_name: s.full_name,
                        status: s.status || 'present',
                        currentStatus: s.status,
                    }))
                );
            })
            .finally(() => setIsLoading(false));
    }, [selectedClass, date]);

    const setAllStatus = (status: AttendanceStatus) => {
        setStudents((prev) =>
            prev.map((s) => ({ ...s, status }))
        );
    };

    const toggleStudentStatus = (studentId: string, status: AttendanceStatus) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.student_id === studentId ? { ...s, status } : s
            )
        );
    };

    const handleSubmit = () => {
        if (!selectedClass || students.length === 0) return;

        startTransition(async () => {
            const attendanceData = students.map((s) => ({
                student_id: s.student_id,
                status: s.status,
            }));

            const result = await markBulkAttendance(selectedClass, date, attendanceData);

            if (result.success) {
                setSuccess(`Marked attendance for ${students.length} students`);
                setTimeout(() => {
                    router.push('/attendance');
                    router.refresh();
                }, 1500);
            }
        });
    };

    const presentCount = students.filter((s) => s.status === 'present').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;
    const lateCount = students.filter((s) => s.status === 'late').length;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Select Class & Date</CardTitle>
                    <CardDescription>Choose the class and date for bulk attendance marking</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Institute (Optional)</Label>
                            <Select value={selectedInstitute} onValueChange={setSelectedInstitute}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All institutes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Institutes</SelectItem>
                                    {institutes.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Class *</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredClasses.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.class_name} ({cls.enrollment_count} students)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            {students.length > 0 && (
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-medium">{students.length} Students</span>
                                </div>
                                <Badge variant="default" className="bg-green-500">{presentCount} Present</Badge>
                                <Badge variant="destructive">{absentCount} Absent</Badge>
                                <Badge variant="secondary">{lateCount} Late</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setAllStatus('present')}>
                                    <CheckCircle2 className="h-4 w-4 mr-1" /> All Present
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setAllStatus('absent')}>
                                    <XCircle className="h-4 w-4 mr-1" /> All Absent
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Students List */}
            {isLoading ? (
                <Card>
                    <CardContent className="py-16 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            ) : students.length > 0 ? (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            <AnimatePresence>
                                {students.map((student, index) => (
                                    <motion.div
                                        key={student.student_id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                                                {student.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium">{student.full_name}</p>
                                                <p className="text-sm text-muted-foreground font-mono">{student.student_code}</p>
                                            </div>
                                            {student.currentStatus && (
                                                <Badge variant="outline" className="ml-2">
                                                    Previously: {student.currentStatus}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={student.status === 'present' ? 'default' : 'outline'}
                                                className={student.status === 'present' ? 'bg-green-500 hover:bg-green-600' : ''}
                                                onClick={() => toggleStudentStatus(student.student_id, 'present')}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={student.status === 'absent' ? 'default' : 'outline'}
                                                className={student.status === 'absent' ? 'bg-red-500 hover:bg-red-600' : ''}
                                                onClick={() => toggleStudentStatus(student.student_id, 'absent')}
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={student.status === 'late' ? 'default' : 'outline'}
                                                className={student.status === 'late' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                                                onClick={() => toggleStudentStatus(student.student_id, 'late')}
                                            >
                                                <Clock className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            ) : selectedClass ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">No students enrolled in this class</p>
                    </CardContent>
                </Card>
            ) : null}

            {/* Submit Button */}
            {students.length > 0 && (
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                {success}
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4" />
                                Save Attendance
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
