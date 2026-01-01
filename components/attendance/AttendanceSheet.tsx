'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, AlertCircle, CheckCheck, XCircle } from 'lucide-react';
import { markAttendance } from '@/lib/actions/attendance';
import type { EnrolledStudentForAttendance, AttendanceStatus, AttendanceRecord } from '@/types/attendance.types';

interface AttendanceSheetProps {
    classId: string;
    className: string;
    date: string;
    students: EnrolledStudentForAttendance[];
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; color: string }> = {
    present: { label: 'Present', icon: Check, color: 'bg-black text-white' },
    absent: { label: 'Absent', icon: X, color: 'bg-white text-black border-2 border-black' },
    late: { label: 'Late', icon: Clock, color: 'bg-gray-500 text-white' },
    excused: { label: 'Excused', icon: AlertCircle, color: 'bg-gray-300 text-black' },
};

export function AttendanceSheet({ classId, className, date, students }: AttendanceSheetProps) {
    const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceStatus>>(() => {
        const map = new Map();
        students.forEach((s) => {
            if (s.attendance_status) {
                map.set(s.student_id, s.attendance_status);
            }
        });
        return map;
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendanceMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(studentId, status);
            return newMap;
        });
        setMessage(null);
    };

    const markAllAs = (status: AttendanceStatus) => {
        setAttendanceMap((prev) => {
            const newMap = new Map(prev);
            students.forEach((s) => newMap.set(s.student_id, status));
            return newMap;
        });
        setMessage(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        const records: AttendanceRecord[] = Array.from(attendanceMap.entries()).map(
            ([student_id, status]) => ({ student_id, status })
        );

        if (records.length === 0) {
            setMessage({ type: 'error', text: 'No attendance marked. Please mark at least one student.' });
            setSaving(false);
            return;
        }

        const result = await markAttendance({ class_id: classId, date, records });

        if (result.success) {
            setMessage({ type: 'success', text: `Attendance saved for ${result.count} students!` });
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to save attendance' });
        }

        setSaving(false);
    };

    const getStatusCounts = () => {
        const counts = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
        students.forEach((s) => {
            const status = attendanceMap.get(s.student_id);
            if (status) {
                counts[status]++;
            } else {
                counts.unmarked++;
            }
        });
        return counts;
    };

    const counts = getStatusCounts();

    return (
        <Card>
            <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                    <CardTitle>{className} - Attendance</CardTitle>
                    <Badge variant="outline" className="text-sm">
                        {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </Badge>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllAs('present')}
                        className="gap-1"
                    >
                        <CheckCheck className="h-4 w-4" />
                        Mark All Present
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAllAs('absent')}
                        className="gap-1"
                    >
                        <XCircle className="h-4 w-4" />
                        Mark All Absent
                    </Button>
                </div>

                {/* Summary */}
                <div className="flex flex-wrap gap-3 text-sm">
                    <span className="px-2 py-1 bg-black text-white rounded">
                        Present: {counts.present}
                    </span>
                    <span className="px-2 py-1 border-2 border-black rounded">
                        Absent: {counts.absent}
                    </span>
                    <span className="px-2 py-1 bg-gray-500 text-white rounded">
                        Late: {counts.late}
                    </span>
                    <span className="px-2 py-1 bg-gray-300 rounded">
                        Excused: {counts.excused}
                    </span>
                    {counts.unmarked > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                            Unmarked: {counts.unmarked}
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {students.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        No students enrolled in this class
                    </div>
                ) : (
                    <div className="space-y-2">
                        {students.map((student) => {
                            const currentStatus = attendanceMap.get(student.student_id);
                            return (
                                <div
                                    key={student.student_id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-sm text-muted-foreground">
                                            {student.student_code}
                                        </span>
                                        <span className="font-medium">{student.full_name}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                                            const config = statusConfig[status];
                                            const Icon = config.icon;
                                            const isSelected = currentStatus === status;
                                            return (
                                                <Button
                                                    key={status}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(student.student_id, status)}
                                                    className={`h-9 w-9 p-0 ${isSelected ? config.color : 'hover:bg-muted'
                                                        }`}
                                                    title={config.label}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Message */}
                {message && (
                    <div
                        className={`p-3 rounded-lg ${message.type === 'success'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} size="lg">
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
