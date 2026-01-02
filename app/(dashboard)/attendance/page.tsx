import { getClassesForAttendance, getAttendanceStats, getTodayAttendanceSummary } from '@/lib/actions/attendance';
import { AttendanceStats } from '@/components/attendance/AttendanceStats';
import { AttendanceRiskWidget } from '@/components/attendance/AttendanceRiskWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ClipboardCheck, FileText, Users } from 'lucide-react';

export default async function AttendancePage() {
    const [classes, stats, todaySummary] = await Promise.all([
        getClassesForAttendance(),
        getAttendanceStats(),
        getTodayAttendanceSummary(),
    ]);

    const today = new Date().toISOString().split('T')[0];

    // Create a map of classes that have been marked today
    const markedTodayMap = new Map(
        todaySummary.map((s) => [s.class_id, s])
    );

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

            {/* Stats & Risk Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AttendanceStats {...stats} />
                </div>
                <div>
                    <AttendanceRiskWidget />
                </div>
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
                                                <Link href={`/attendance/mark/${cls.id}?date=${today}`}>
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
        </div>
    );
}
