import { getEnrolledStudentsWithAttendance } from '@/lib/actions/attendance';
import { getClassById } from '@/lib/actions/classes';
import { AttendanceSheet } from '@/components/attendance/AttendanceSheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';

interface MarkAttendancePageProps {
    params: { classId: string };
    searchParams: { date?: string };
}

export default async function MarkAttendancePage({
    params,
    searchParams,
}: MarkAttendancePageProps) {
    const classId = params.classId;
    const date = searchParams.date || new Date().toISOString().split('T')[0];

    // Get class details
    const classData = await getClassById(classId);
    if (!classData) {
        notFound();
    }

    // Get enrolled students with their attendance for this date
    const students = await getEnrolledStudentsWithAttendance(classId, date);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/attendance">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Mark Attendance</h1>
                        <p className="text-muted-foreground">
                            {classData.class_name} ({classData.class_code})
                        </p>
                    </div>
                </div>

                {/* Date Picker */}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => {
                            window.location.href = `/attendance/mark/${classId}?date=${e.target.value}`;
                        }}
                        className="border rounded-md px-3 py-2 text-sm"
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            {/* Attendance Sheet */}
            {students.length === 0 ? (
                <Card>
                    <CardContent className="py-10">
                        <div className="text-center">
                            <p className="text-muted-foreground">No students enrolled in this class</p>
                            <Link href={`/classes/${classId}`}>
                                <Button variant="link" className="mt-2">
                                    Manage Enrollments
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <AttendanceSheet
                    classId={classId}
                    className={classData.class_name}
                    date={date}
                    students={students}
                />
            )}
        </div>
    );
}
