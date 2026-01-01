import { getClassesForAttendance, getClassAttendanceHistory } from '@/lib/actions/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AttendanceReportsPageProps {
    searchParams: {
        classId?: string;
        startDate?: string;
        endDate?: string;
    };
}

export default async function AttendanceReportsPage({
    searchParams,
}: AttendanceReportsPageProps) {
    const classes = await getClassesForAttendance();

    // Default to last 30 days
    const endDate = searchParams.endDate || new Date().toISOString().split('T')[0];
    const startDate = searchParams.startDate || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    })();

    const selectedClassId = searchParams.classId;

    // Get attendance history if a class is selected
    let attendanceHistory: any[] = [];
    if (selectedClassId) {
        attendanceHistory = await getClassAttendanceHistory(selectedClassId, startDate, endDate);
    }

    const selectedClass = classes.find((c) => c.id === selectedClassId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/attendance">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Attendance Reports</h1>
                    <p className="text-muted-foreground">View attendance history and analytics</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-wrap gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Class</label>
                            <select
                                name="classId"
                                defaultValue={selectedClassId || ''}
                                className="border rounded-md px-3 py-2 min-w-[200px]"
                            >
                                <option value="">Select a class</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.class_name} ({cls.class_code})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                defaultValue={startDate}
                                className="border rounded-md px-3 py-2"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                defaultValue={endDate}
                                className="border rounded-md px-3 py-2"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="submit">Apply Filters</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            {selectedClassId ? (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            Attendance History - {selectedClass?.class_name}
                        </CardTitle>
                        <CardDescription>
                            Showing records from {new Date(startDate).toLocaleDateString()} to{' '}
                            {new Date(endDate).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {attendanceHistory.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No attendance records found for the selected period
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Total Marked</TableHead>
                                        <TableHead>Present</TableHead>
                                        <TableHead>Absent</TableHead>
                                        <TableHead>Late</TableHead>
                                        <TableHead>Excused</TableHead>
                                        <TableHead>Attendance %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceHistory.map((record) => (
                                        <TableRow key={record.date}>
                                            <TableCell className="font-medium">
                                                {new Date(record.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </TableCell>
                                            <TableCell>{record.total_marked}</TableCell>
                                            <TableCell>
                                                <Badge variant="default">{record.present_count}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{record.absent_count}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{record.late_count}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{record.excused_count}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`font-semibold ${record.attendance_percentage >= 80
                                                            ? 'text-green-600'
                                                            : record.attendance_percentage >= 60
                                                                ? 'text-yellow-600'
                                                                : 'text-red-600'
                                                        }`}
                                                >
                                                    {record.attendance_percentage}%
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Summary Stats */}
                        {attendanceHistory.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h4 className="font-semibold mb-3">Period Summary</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">
                                            {attendanceHistory.reduce((sum, r) => sum + r.present_count, 0)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total Present</div>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">
                                            {attendanceHistory.reduce((sum, r) => sum + r.absent_count, 0)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total Absent</div>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">{attendanceHistory.length}</div>
                                        <div className="text-sm text-muted-foreground">Days Recorded</div>
                                    </div>
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold">
                                            {Math.round(
                                                attendanceHistory.reduce((sum, r) => sum + r.attendance_percentage, 0) /
                                                attendanceHistory.length
                                            )}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Avg. Attendance</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="py-10">
                        <div className="text-center text-muted-foreground">
                            Select a class to view attendance reports
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
