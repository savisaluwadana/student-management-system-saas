'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import AttendanceModel from '@/lib/mongodb/models/Attendance';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import { getCurrentUser } from '@/lib/auth/auth';
import mongoose from 'mongoose';
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

export async function getClassesForAttendance(): Promise<ClassWithEnrollmentCount[]> {
  await connectDB();

  const classes = await Class.find({ status: 'active' }).sort({ class_name: 1 }).lean({ virtuals: true });

  return await Promise.all(
    (classes as any[]).map(async (cls) => {
      const count = await Enrollment.countDocuments({ class_id: cls._id, status: 'active' });
      return {
        id: cls._id.toString(),
        institute_id: cls.institute_id?.toString(),
        class_code: cls.class_code,
        class_name: cls.class_name,
        subject: cls.subject,
        schedule: cls.schedule,
        enrollment_count: count,
      };
    })
  );
}

export async function getEnrolledStudentsWithAttendance(
  classId: string,
  date: string
): Promise<EnrolledStudentForAttendance[]> {
  await connectDB();

  const enrollments = await Enrollment.find({ class_id: classId, status: 'active' })
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  const attendanceRecords = await AttendanceModel.find({ class_id: classId, date }).lean({ virtuals: true });
  const attendanceMap = new Map((attendanceRecords as any[]).map((a) => [a.student_id.toString(), a]));

  return (enrollments as any[]).map((e) => ({
    student_id: e.student_id?._id?.toString(),
    student_code: e.student_id?.student_code,
    full_name: e.student_id?.full_name,
    attendance_status: attendanceMap.get(e.student_id?._id?.toString())?.status,
    attendance_notes: attendanceMap.get(e.student_id?._id?.toString())?.notes,
  }));
}

export async function markAttendance(
  input: MarkAttendanceInput
): Promise<{ success: boolean; error?: string; count?: number }> {
  await connectDB();
  const currentUser = await getCurrentUser();

  try {
    await Promise.all(
      input.records.map((record) =>
        AttendanceModel.findOneAndUpdate(
          { class_id: input.class_id, student_id: record.student_id, date: input.date },
          {
            class_id: input.class_id,
            student_id: record.student_id,
            date: input.date,
            status: record.status,
            marked_by: currentUser?.id,
            notes: record.notes || null,
          },
          { upsert: true, new: true }
        )
      )
    );

    revalidatePath('/attendance');
    revalidatePath(`/attendance/mark/${input.class_id}`);
    return { success: true, count: input.records.length };
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    return { success: false, error: error.message };
  }
}

export async function getAttendanceByClassAndDate(
  classId: string,
  date: string
): Promise<AttendanceWithStudent[]> {
  await connectDB();

  const records = await AttendanceModel.find({ class_id: classId, date })
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  return (records as any[]).map((r) => ({
    ...r,
    id: r._id.toString(),
    student: {
      id: r.student_id?._id?.toString(),
      student_code: r.student_id?.student_code,
      full_name: r.student_id?.full_name,
    },
  })) as unknown as AttendanceWithStudent[];
}

export async function getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary[]> {
  await connectDB();

  const summary = await AttendanceModel.aggregate([
    { $match: { student_id: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$class_id',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: '_id',
        as: 'class',
      },
    },
    { $unwind: { path: '$class', preserveNullAndEmpty: true } },
  ]);

  return summary.map((s) => ({
    student_id: studentId,
    class_id: s._id.toString(),
    class_name: s.class?.class_name,
    total_classes: s.total,
    present_count: s.present,
    absent_count: s.absent,
    late_count: s.late,
    attendance_rate: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0,
  })) as unknown as StudentAttendanceSummary[];
}

export async function getTodayAttendanceSummary(): Promise<ClassAttendanceDaily[]> {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];

  const summary = await AttendanceModel.aggregate([
    { $match: { date: today } },
    {
      $group: {
        _id: '$class_id',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
    { $unwind: { path: '$class', preserveNullAndEmpty: true } },
  ]);

  return summary.map((s) => ({
    class_id: s._id.toString(),
    class_name: s.class?.class_name,
    date: today,
    total_students: s.total,
    present_count: s.present,
    absent_count: s.absent,
    late_count: s.late,
  })) as unknown as ClassAttendanceDaily[];
}

export async function getClassAttendanceHistory(
  classId: string,
  startDate: string,
  endDate: string
): Promise<ClassAttendanceDaily[]> {
  await connectDB();

  const summary = await AttendanceModel.aggregate([
    { $match: { class_id: new mongoose.Types.ObjectId(classId), date: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: '$date',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
      },
    },
    { $sort: { _id: -1 } },
  ]);

  return summary.map((s) => ({
    class_id: classId,
    date: s._id,
    total_students: s.total,
    present_count: s.present,
    absent_count: s.absent,
    late_count: s.late,
  })) as unknown as ClassAttendanceDaily[];
}

export async function getAttendanceStats(): Promise<{
  totalMarkedToday: number;
  presentToday: number;
  absentToday: number;
  overallAttendanceRate: number;
}> {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const todayRecords = await AttendanceModel.find({ date: today }).select('status').lean();
  const totalMarkedToday = todayRecords.length;
  const presentToday = todayRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
  const absentToday = todayRecords.filter((r: any) => r.status === 'absent').length;

  const monthRecords = await AttendanceModel.find({ date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } }).select('status').lean();
  const totalMonth = monthRecords.length;
  const presentMonth = monthRecords.filter((r: any) => r.status === 'present' || r.status === 'late').length;
  const overallAttendanceRate = totalMonth > 0 ? Math.round((presentMonth / totalMonth) * 100) : 0;

  return { totalMarkedToday, presentToday, absentToday, overallAttendanceRate };
}

export async function deleteAttendance(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await AttendanceModel.findByIdAndDelete(id);
    revalidatePath('/attendance');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting attendance:', error);
    return { success: false, error: error.message };
  }
}

export async function getStudentAttendanceHistory(studentId: string, limit = 50): Promise<any[]> {
  await connectDB();

  const records = await AttendanceModel.find({ student_id: studentId })
    .sort({ date: -1 })
    .limit(limit)
    .populate('class_id', 'class_name subject')
    .lean({ virtuals: true });

  return (records as any[]).map((r) => ({
    id: r._id.toString(),
    date: r.date,
    status: r.status,
    notes: r.notes,
    classes: { class_name: r.class_id?.class_name, subject: r.class_id?.subject },
  }));
}

export async function markBulkAttendance(
  classId: string,
  date: string,
  records: Array<{ student_id: string; status: AttendanceStatus }>
): Promise<{ success: boolean; error?: string; count?: number }> {
  return markAttendance({ class_id: classId, date, records });
}

export async function markAttendanceByBarcode(
  classId: string,
  date: string,
  barcode: string
): Promise<{ success: boolean; message?: string; studentName?: string }> {
  await connectDB();
  const currentUser = await getCurrentUser();

  const student = await Student.findOne({ $or: [{ barcode }, { student_code: barcode }] }).lean({ virtuals: true });
  if (!student) return { success: false, message: 'Student not found' };

  const s = student as any;
  const enrollment = await Enrollment.findOne({ student_id: s._id, class_id: classId, status: 'active' });
  if (!enrollment) return { success: false, message: 'Not enrolled in class', studentName: s.full_name };

  try {
    await AttendanceModel.findOneAndUpdate(
      { class_id: classId, student_id: s._id, date },
      { class_id: classId, student_id: s._id, date, status: 'present', marked_by: currentUser?.id },
      { upsert: true, new: true }
    );

    revalidatePath('/attendance');
    return { success: true, message: 'Marked present', studentName: s.full_name };
  } catch (error: any) {
    return { success: false, message: 'Failed to mark', studentName: s.full_name };
  }
}

export async function getAttendanceTrend(): Promise<Array<{ date: string; present: number; absent: number; late: number; total: number }>> {
  await connectDB();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const records = await AttendanceModel.find({ date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } })
    .select('date status')
    .sort({ date: 1 })
    .lean();

  const grouped = (records as any[]).reduce((acc: any, record) => {
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
