'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, AlertCircle, CheckCheck, XCircle, LayoutGrid, List, Sparkles, Flame } from 'lucide-react';
import { markAttendance } from '@/lib/actions/attendance';
import type { EnrolledStudentForAttendance, AttendanceStatus, AttendanceRecord } from '@/types/attendance.types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface AttendanceSheetProps {
    classId: string;
    className: string;
    date: string;
    students: EnrolledStudentForAttendance[];
}

const statusConfig: Record<AttendanceStatus, { label: string; icon: any; color: string; bg: string; border: string }> = {
    present: { label: 'Present', icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    absent: { label: 'Absent', icon: X, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    late: { label: 'Late', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    excused: { label: 'Excused', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
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
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendanceMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(studentId, status);
            return newMap;
        });
    };

    const markAllAs = (status: AttendanceStatus) => {
        setAttendanceMap((prev) => {
            const newMap = new Map(prev);
            students.forEach((s) => newMap.set(s.student_id, status));
            return newMap;
        });
        toast({
            title: `Marked all as ${statusConfig[status].label}`,
            description: "Don't forget to save changes.",
        })
    };

    const handleSave = async () => {
        setSaving(true);

        const records: AttendanceRecord[] = Array.from(attendanceMap.entries()).map(
            ([student_id, status]) => ({ student_id, status })
        );

        if (records.length === 0) {
            toast({
                variant: "destructive",
                title: "No attendance marked",
                description: "Please mark at least one student before saving.",
            })
            setSaving(false);
            return;
        }

        const result = await markAttendance({ class_id: classId, date, records });

        if (result.success) {
            toast({
                title: "Attendance Saved",
                description: `Successfully updated records for ${result.count} students.`,
            })
        } else {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: result.error || "Could not save attendance records.",
            })
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg">
                <CardHeader className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-400">
                                {className}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {new Date(date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('list')}
                            >
                                <List className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setViewMode('grid')}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                        {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => (
                            <div key={status} className={cn(
                                "flex flex-col items-center p-3 rounded-xl border transition-all",
                                statusConfig[status].bg,
                                statusConfig[status].border
                            )}>
                                <span className={cn("text-2xl font-bold", statusConfig[status].color)}>
                                    {counts[status]}
                                </span>
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {statusConfig[status].label}
                                </span>
                            </div>
                        ))}
                        <div className="flex flex-col items-center p-3 rounded-xl border bg-gray-100/50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700">
                            <span className="text-2xl font-bold text-gray-500">
                                {counts.unmarked}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Unmarked
                            </span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAs('present')}
                            className="gap-2 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                        >
                            <CheckCheck className="h-4 w-4" />
                            All Present
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAs('absent')}
                            className="gap-2 hover:border-rose-500 hover:text-rose-500 transition-colors"
                        >
                            <XCircle className="h-4 w-4" />
                            All Absent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                // Smart Fill: Mark all present except random few (mock AI)
                                setAttendanceMap((prev) => {
                                    const newMap = new Map(prev);
                                    students.forEach((s) => {
                                        // Mock: 90% chance of being present
                                        if (Math.random() > 0.1) {
                                            newMap.set(s.student_id, 'present');
                                        } else {
                                            newMap.set(s.student_id, 'absent');
                                        }
                                    });
                                    return newMap;
                                });
                                toast({
                                    title: "AI Smart Fill Applied",
                                    description: "Predicted attendance based on historical patterns.",
                                })
                            }}
                            className="gap-2 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:border-indigo-300 transition-all ml-auto"
                        >
                            <Sparkles className="h-4 w-4" />
                            AI Smart Fill
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {students.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            No students enrolled in this class
                        </div>
                    ) : (
                        <div className={viewMode === 'list'
                            ? "space-y-3"
                            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        }>
                            <AnimatePresence>
                                {students.map((student) => {
                                    const currentStatus = attendanceMap.get(student.student_id);
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            key={student.student_id}
                                            className={cn(
                                                "group relative overflow-hidden rounded-xl border bg-white dark:bg-zinc-950 transition-all hover:shadow-md",
                                                currentStatus && statusConfig[currentStatus].border,
                                                viewMode === 'list' ? 'p-4 flex items-center justify-between' : 'p-6 flex flex-col gap-4'
                                            )}
                                        >
                                            {/* Status Background Indicator */}
                                            <div className={cn(
                                                "absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity",
                                                currentStatus ? statusConfig[currentStatus].bg : "bg-gray-100 dark:bg-zinc-800"
                                            )} />

                                            <div className="flex items-center gap-4 z-10">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                                                    currentStatus
                                                        ? cn(statusConfig[currentStatus].bg, statusConfig[currentStatus].color)
                                                        : "bg-gray-100 text-gray-500 dark:bg-zinc-800"
                                                )}>
                                                    {student.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {student.full_name}
                                                    </h3>
                                                    <p className="text-xs font-mono text-muted-foreground">
                                                        {student.student_code}
                                                    </p>
                                                </div>
                                                {/* Mock Streak Badge */}
                                                <div className="ml-auto flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full text-xs font-bold" title="12 Day Stake">
                                                    <Flame className="h-3 w-3 fill-orange-500" />
                                                    <span>12</span>
                                                </div>
                                            </div>

                                            <div className={cn(
                                                "flex gap-1 z-10",
                                                viewMode === 'grid' && "justify-between w-full pt-2 border-t mt-2"
                                            )}>
                                                {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                                                    const config = statusConfig[status];
                                                    const Icon = config.icon;
                                                    const isSelected = currentStatus === status;
                                                    return (
                                                        <Button
                                                            key={status}
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleStatusChange(student.student_id, status)}
                                                            className={cn(
                                                                "h-9 w-9 rounded-full transition-all",
                                                                isSelected
                                                                    ? cn(config.bg, config.color, "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-black", config.border.replace('border-', 'ring-'))
                                                                    : "text-muted-foreground hover:bg-muted"
                                                            )}
                                                            title={config.label}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="sticky bottom-4 flex justify-end pt-8 pb-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            size="lg"
                            className="shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] bg-gradient-to-r from-gray-900 to-gray-800 text-white"
                        >
                            {saving ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin">⏳</span> Saving...
                                </span>
                            ) : 'Save Attendance Records'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
