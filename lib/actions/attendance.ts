'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
    Attendance,
    AttendanceWithStudent,
    MarkAttendanceInput,
    StudentAttendanceSummary,
    ClassAttendanceDaily,
    ClassWithEnrollmentCount,
    EnrolledStudentForAttendance,
    AttendanceStatus,
} from '@/types/attendance.types';

/**
 * Get all active classes with enrollment counts for attendance marking
 */
export async function getClassesForAttendance(): Promise<ClassWithEnrollmentCount[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('classes')
        .select(`
      id,
      class_code,
      class_name,
      subject,
      schedule,
      enrollments(id)
    `)
        .eq('status', 'active')
        .order('class_name');

    if (error) {
        console.error('Error fetching classes for attendance:', error);
        return [];
    }

    return (data || []).map((cls: any) => ({
        id: cls.id,
        class_code: cls.class_code,
        class_name: cls.class_name,
        subject: cls.subject,
        schedule: cls.schedule,
        enrollment_count: cls.enrollments?.length || 0,
    }));
}

/**
 * Get enrolled students for a class with their attendance for a specific date
 */
export async function getEnrolledStudentsWithAttendance(
    classId: string,
    date: string
): Promise<EnrolledStudentForAttendance[]> {
    const supabase = await createClient();

    // Get enrolled students
    const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
      student_id,
      students(id, student_code, full_name)
    `)
        .eq('class_id', classId)
        .eq('status', 'active');

    if (enrollmentError) {
        console.error('Error fetching enrolled students:', enrollmentError);
        return [];
    }

    // Get existing attendance for this date
    const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status, notes')
        .eq('class_id', classId)
        .eq('date', date);

    if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
    }

    // Map attendance to students
    const attendanceMap = new Map(
        (attendanceRecords || []).map((a) => [a.student_id, a])
    );

    return (enrollments || []).map((e: any) => ({
        student_id: e.students.id,
        student_code: e.students.student_code,
        full_name: e.students.full_name,
        attendance_status: attendanceMap.get(e.student_id)?.status,
        attendance_notes: attendanceMap.get(e.student_id)?.notes,
    }));
}

/**
 * Mark attendance for multiple students in a class
 */
export async function markAttendance(
    input: MarkAttendanceInput
): Promise<{ success: boolean; error?: string; count?: number }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare upsert data
    const attendanceData = input.records.map((record) => ({
        class_id: input.class_id,
        student_id: record.student_id,
        date: input.date,
        status: record.status,
        marked_by: user?.id,
        notes: record.notes || null,
    }));

    // Upsert attendance records (update if exists, insert if not)
    const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, {
            onConflict: 'class_id,student_id,date',
        });

    if (error) {
        console.error('Error marking attendance:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    revalidatePath(`/attendance/mark/${input.class_id}`);
    return { success: true, count: input.records.length };
}

/**
 * Get attendance for a specific class on a specific date
 */
export async function getAttendanceByClassAndDate(
    classId: string,
    date: string
): Promise<AttendanceWithStudent[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('attendance')
        .select(`
      *,
      student:students(id, student_code, full_name)
    `)
        .eq('class_id', classId)
        .eq('date', date);

    if (error) {
        console.error('Error fetching attendance:', error);
        return [];
    }

    return data || [];
}

/**
 * Get attendance summary for a student across all classes
 */
export async function getStudentAttendanceSummary(
    studentId: string
): Promise<StudentAttendanceSummary[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('student_attendance_summary')
        .select('*')
        .eq('student_id', studentId);

    if (error) {
        console.error('Error fetching student attendance summary:', error);
        return [];
    }

    return data || [];
}

/**
 * Get daily attendance summary for all classes (for dashboard)
 */
export async function getTodayAttendanceSummary(): Promise<ClassAttendanceDaily[]> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('class_attendance_daily')
        .select('*')
        .eq('date', today);

    if (error) {
        console.error('Error fetching today attendance summary:', error);
        return [];
    }

    return data || [];
}

/**
 * Get attendance history for a class within a date range
 */
export async function getClassAttendanceHistory(
    classId: string,
    startDate: string,
    endDate: string
): Promise<ClassAttendanceDaily[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('class_attendance_daily')
        .select('*')
        .eq('class_id', classId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching class attendance history:', error);
        return [];
    }

    return data || [];
}

/**
 * Get overall attendance statistics
 */
export async function getAttendanceStats(): Promise<{
    totalMarkedToday: number;
    presentToday: number;
    absentToday: number;
    overallAttendanceRate: number;
}> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Get today's stats
    const { data: todayData, error: todayError } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

    if (todayError) {
        console.error('Error fetching today stats:', todayError);
    }

    const todayRecords = todayData || [];
    const totalMarkedToday = todayRecords.length;
    const presentToday = todayRecords.filter(
        (r) => r.status === 'present' || r.status === 'late'
    ).length;
    const absentToday = todayRecords.filter((r) => r.status === 'absent').length;

    // Get last 30 days stats for overall rate
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: monthData, error: monthError } = await supabase
        .from('attendance')
        .select('status')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (monthError) {
        console.error('Error fetching month stats:', monthError);
    }

    const monthRecords = monthData || [];
    const totalMonth = monthRecords.length;
    const presentMonth = monthRecords.filter(
        (r) => r.status === 'present' || r.status === 'late'
    ).length;
    const overallAttendanceRate =
        totalMonth > 0 ? Math.round((presentMonth / totalMonth) * 100) : 0;

    return {
        totalMarkedToday,
        presentToday,
        absentToday,
        overallAttendanceRate,
    };
}

/**
 * Delete attendance record
 */
export async function deleteAttendance(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting attendance:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    return { success: true };
}


/**
 * Get detailed attendance history for a student
 */
export async function getStudentAttendanceHistory(
    studentId: string,
    limit = 50
): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('attendance')
        .select(`
            id,
            date,
            status,
            notes,
            classes(class_name, subject)
        `)
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching student attendance history:', error);
        return [];
    }

    return data || [];
}

/**
 * Mark bulk attendance for multiple students at once
 */
export async function markBulkAttendance(
    classId: string,
    date: string,
    records: Array<{ student_id: string; status: AttendanceStatus }>
): Promise<{ success: boolean; error?: string; count?: number }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Prepare upsert data
    const attendanceData = records.map((record) => ({
        class_id: classId,
        student_id: record.student_id,
        date: date,
        status: record.status,
        marked_by: user?.id,
    }));

    // Upsert attendance records
    const { error } = await supabase
        .from('attendance')
        .upsert(attendanceData, {
            onConflict: 'class_id,student_id,date',
        });

    if (error) {
        console.error('Error marking bulk attendance:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/attendance');
    revalidatePath('/attendance/bulk');
    return { success: true, count: records.length };
}

/**
 * Mark attendance using barcode (scan mode)
 */
export async function markAttendanceByBarcode(
    classId: string,
    date: string,
    barcode: string
): Promise<{ success: boolean; message?: string; studentName?: string }> {
    const supabase = await createClient();

    // Find student by barcode or student_code
    const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, student_code, full_name, barcode')
        .or(`barcode.eq.${barcode},student_code.eq.${barcode}`)
        .single();

    if (studentError || !student) {
        return { success: false, message: 'Student not found' };
    }

    // Check if student is enrolled in this class
    const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', student.id)
        .eq('class_id', classId)
        .eq('status', 'active')
        .single();

    if (enrollmentError || !enrollment) {
        return {
            success: false,
            message: 'Not enrolled in class',
            studentName: student.full_name
        };
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Mark attendance as present
    const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert({
            class_id: classId,
            student_id: student.id,
            date: date,
            status: 'present',
            marked_by: user?.id,
        }, {
            onConflict: 'class_id,student_id,date',
        });

    if (attendanceError) {
        return {
            success: false,
            message: 'Failed to mark',
            studentName: student.full_name
        };
    }

    revalidatePath('/attendance');
    revalidatePath('/attendance/scan');

    return {
        success: true,
        message: 'Marked present',
        studentName: student.full_name
    };
}

/**
 * Get 30-day attendance trend data for analytics
 */
export async function getAttendanceTrend(): Promise<Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    total: number;
}>> {
    const supabase = await createClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
        .from('attendance')
        .select('date, status')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching attendance trend:', error);
        return [];
    }

    // Group by date
    const grouped = (data || []).reduce((acc: any, record) => {
        if (!acc[record.date]) {
            acc[record.date] = { date: record.date, present: 0, absent: 0, late: 0, total: 0 };
        }
        acc[record.date].total++;
        if (record.status === 'present') acc[record.date].present++;
        else if (record.status === 'absent') acc[record.date].absent++;
        else if (record.status === 'late') acc[record.date].late++;
        return acc;
    }, {});

    return Object.values(grouped);
}
