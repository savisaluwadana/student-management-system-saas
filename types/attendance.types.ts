export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Attendance {
    id: string;
    class_id: string;
    student_id: string;
    date: string;
    status: AttendanceStatus;
    marked_by: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface AttendanceWithStudent extends Attendance {
    student: {
        id: string;
        student_code: string;
        full_name: string;
    };
}

export interface AttendanceRecord {
    student_id: string;
    status: AttendanceStatus;
    notes?: string;
}

export interface MarkAttendanceInput {
    class_id: string;
    date: string;
    records: AttendanceRecord[];
}

export interface StudentAttendanceSummary {
    student_id: string;
    student_code: string;
    student_name: string;
    class_id: string;
    class_name: string;
    total_classes: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_percentage: number;
}

export interface ClassAttendanceDaily {
    class_id: string;
    class_code: string;
    class_name: string;
    date: string;
    total_marked: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_percentage: number;
}

export interface ClassWithEnrollmentCount {
    id: string;
    class_code: string;
    class_name: string;
    subject: string;
    schedule: string | null;
    enrollment_count: number;
}

export interface EnrolledStudentForAttendance {
    student_id: string;
    student_code: string;
    full_name: string;
    attendance_status?: AttendanceStatus;
    attendance_notes?: string;
}
