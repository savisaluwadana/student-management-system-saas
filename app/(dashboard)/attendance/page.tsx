import { getClassesForAttendance, getAttendanceStats, getTodayAttendanceSummary, getEnrolledStudentsWithAttendance } from '@/lib/actions/attendance';
import { getClassById } from '@/lib/actions/classes';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';

import { AttendanceSheet } from '@/components/attendance/AttendanceSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ClipboardCheck, FileText, Users, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { redirect } from 'next/navigation';

interface AttendancePageProps {
    searchParams: { classId?: string; date?: string };
}

export default async function AttendancePage({ searchParams }: AttendancePageProps) {
    const [classes, stats, todaySummary] = await Promise.all([
        getClassesForAttendance(),
        getAttendanceStats(),
        getTodayAttendanceSummary(),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const selectedDate = searchParams.date || today;

    // Create a map of classes that have been marked today
    const markedTodayMap = new Map(
        todaySummary.map((s) => [s.class_id, s])
    );

    // If classId is selected, fetch data for the modal
    let selectedClass = null;
    let selectedStudents: any[] = [];

    if (searchParams.classId) {
        const [cls, students] = await Promise.all([
            getClassById(searchParams.classId),
            getEnrolledStudentsWithAttendance(searchParams.classId, selectedDate)
        ]);
        selectedClass = cls;
        selectedStudents = students;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Attendance</h1>
                    <p className="text-muted-foreground">Track and manage student attendance</p>
                </div>
                <Link href="/attendance/reports">
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6">
                <AttendanceStats {...stats} />
            </div>

            {/* Classes List */}
            <Card>
                <CardHeader>
                    <CardTitle>Mark Attendance</CardTitle>
                    <CardDescription>
                        Select a class to mark attendance for today ({new Date().toLocaleDateString()})
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {classes.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">No active classes found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create classes and enroll students to start marking attendance
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class Code</TableHead>
                                    <TableHead>Class Name</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Today's Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((cls) => {
                                    const todayRecord = markedTodayMap.get(cls.id);
                                    const isMarked = !!todayRecord;
                                    return (
                                        <TableRow key={cls.id}>
                                            <TableCell className="font-medium font-mono">
                                                {cls.class_code}
                                            </TableCell>
                                            <TableCell>{cls.class_name}</TableCell>
                                            <TableCell>{cls.subject}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-4 w-4 text-muted-foreground" />
                                                    {cls.enrollment_count}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isMarked ? (
                                                    <Badge variant="default" className="gap-1">
                                                        <ClipboardCheck className="h-3 w-3" />
                                                        Marked ({todayRecord.present_count}/{todayRecord.total_marked})
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">Not Marked</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {/* Update Link to use searchParams for Modal */}
                                                <Link href={`/attendance?classId=${cls.id}&date=${today}`} scroll={false}>
                                                    <Button size="sm">
                                                        {isMarked ? 'Update' : 'Mark Attendance'}
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Attendance Marking Modal */}
            {selectedClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-5xl h-[90vh] overflow-y-auto bg-background rounded-xl shadow-2xl p-6 border animate-in zoom-in-95 duration-200">
                        <div className="absolute right-4 top-4">
                            <Link href="/attendance" scroll={false}>
                                <Button variant="ghost" size="icon">
                                    <X className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        <AttendanceSheet
                            classId={selectedClass.id}
                            className={selectedClass.class_name}
                            date={selectedDate}
                            students={selectedStudents}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
