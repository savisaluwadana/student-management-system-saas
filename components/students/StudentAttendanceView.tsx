"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, AlertCircle } from "lucide-react";

interface AttendanceRecord {
    id: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string;
    classes: {
        class_name: string;
        subject: string;
    };
}

interface StudentAttendanceViewProps {
    history: AttendanceRecord[];
}

const statusConfig = {
    present: { label: 'Present', icon: Check, color: 'bg-emerald-100 text-emerald-700' },
    absent: { label: 'Absent', icon: X, color: 'bg-rose-100 text-rose-700' },
    late: { label: 'Late', icon: Clock, color: 'bg-amber-100 text-amber-700' },
    excused: { label: 'Excused', icon: AlertCircle, color: 'bg-blue-100 text-blue-700' },
};

export function StudentAttendanceView({ history }: StudentAttendanceViewProps) {
    // Calculate simple stats
    const total = history.length;
    const present = history.filter(h => h.status === 'present' || h.status === 'late').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                        <Check className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rate}%</div>
                        <p className="text-xs text-muted-foreground">Overall presence</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{total}</div>
                        <p className="text-xs text-muted-foreground">Recorded sessions</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No attendance records found.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Class</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {history.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>
                                            {new Date(record.date).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{record.classes?.class_name}</span>
                                                <span className="text-xs text-muted-foreground">{record.classes?.subject}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={statusConfig[record.status]?.color}>
                                                {statusConfig[record.status]?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {record.notes || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
