'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import AttendanceModel from '@/lib/mongodb/models/Attendance';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import type {
  AttendanceWithStudent,
  MarkAttendanceInput,
  StudentAttendanceSummary,
  ClassAttendanceDaily,
  ClassWithEnrollmentCount,
  EnrolledStudentForAttendance,
  AttendanceStatus,
} from '@/types/attendance.types';
import { requireWorkspaceContext, workspaceFilter, workspaceValue } from '@/lib/saas/workspace';

async function classBelongsToWorkspace(classId: string, context: Awaited<ReturnType<typeof requireWorkspaceContext>>) {
  if (!mongoose.isValidObjectId(classId)) return false;
  return Boolean(await Class.exists(workspaceFilter(context, { _id: classId })));
}

export async function getClassesForAttendance(): Promise<ClassWithEnrollmentCount[]> {
  await connectDB();
  const context = await requireWorkspaceContext();

  const classes = await Class.find(workspaceFilter(context, { status: 'active' }))
    .sort({ class_name: 1 })
    .lean({ virtuals: true });

  return await Promise.all(
    (classes as any[]).map(async (cls) => {
      const count = await Enrollment.countDocuments(
        workspaceFilter(context, { class_id: cls._id, status: 'active' })
      );
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
  const context = await requireWorkspaceContext();
  if (!(await classBelongsToWorkspace(classId, context))) return [];

  const enrollments = await Enrollment.find(workspaceFilter(context, { class_id: classId, status: 'active' }))
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  const attendanceRecords = await AttendanceModel.find(workspaceFilter(context, { class_id: classId, date })).lean({ virtuals: true });
  const attendanceMap = new Map((attendanceRecords as any[]).map((record) => [record.student_id.toString(), record]));

  return (enrollments as any[]).map((enrollment) => ({
    student_id: enrollment.student_id?._id?.toString(),
    student_code: enrollment.student_id?.student_code,
    full_name: enrollment.student_id?.full_name,
    attendance_status: attendanceMap.get(enrollment.student_id?._id?.toString())?.status,
    attendance_notes: attendanceMap.get(enrollment.student_id?._id?.toString())?.notes,
  }));
}

export async function markAttendance(
  input: MarkAttendanceInput
): Promise<{ success: boolean; error?: string; count?: number }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  try {
    if (!(await classBelongsToWorkspace(input.class_id, context))) {
      return { success: false, error: 'Class not found in this workspace.' };
    }

    const studentIds = Array.from(new Set(input.records.map((record) => record.student_id)));
    if (studentIds.some((id) => !mongoose.isValidObjectId(id))) {
      return { success: false, error: 'One or more student IDs are invalid.' };
    }

    const enrollmentCount = await Enrollment.countDocuments(workspaceFilter(context, {
      class_id: input.class_id,
      student_id: { $in: studentIds },
      status: 'active',
    }));
    if (enrollmentCount !== studentIds.length) {
      return { success: false, error: 'One or more students are not enrolled in this class or workspace.' };
    }

    await Promise.all(
      input.records.map((record) =>
        AttendanceModel.findOneAndUpdate(
          workspaceFilter(context, { class_id: input.class_id, student_id: record.student_id, date: input.date }),
          {
            workspace_id: workspaceValue(context),
            class_id: input.class_id,
            student_id: record.student_id,
            date: input.date,
            status: record.status,
            marked_by: context.user.id,
            notes: record.notes || null,
          },
          { upsert: true, new: true }
        )
      )
    );

    revalidatePath('/attendance');
    revalidatePath(`/attendance/mark/${input.class_id}`);
    revalidatePath('/dashboard');
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
  const context = await requireWorkspaceContext();
  if (!(await classBelongsToWorkspace(classId, context))) return [];

  const records = await AttendanceModel.find(workspaceFilter(context, { class_id: classId, date }))
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  return (records as any[]).map((record) => ({
    ...record,
    id: record._id.toString(),
    student: {
      id: record.student_id?._id?.toString(),
      student_code: record.student_id?.student_code,
      full_name: record.student_id?.full_name,
    },
  })) as unknown as AttendanceWithStudent[];
}

export async function getStudentAttendanceSummary(studentId: string): Promise<StudentAttendanceSummary[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(studentId)) return [];
  const student = await Student.exists(workspaceFilter(context, { _id: studentId }));
  if (!student) return [];

  const summary = await AttendanceModel.aggregate([
    { $match: workspaceFilter(context, { student_id: new mongoose.Types.ObjectId(studentId) }) },
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
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
  ]);

  return summary.map((item) => ({
    student_id: studentId,
    class_id: item._id.toString(),
    class_name: item.class?.class_name,
    total_classes: item.total,
    present_count: item.present,
    absent_count: item.absent,
    late_count: item.late,
    attendance_rate: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0,
  })) as unknown as StudentAttendanceSummary[];
}

export async function getTodayAttendanceSummary(): Promise<ClassAttendanceDaily[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const today = new Date().toISOString().split('T')[0];

  const summary = await AttendanceModel.aggregate([
    { $match: workspaceFilter(context, { date: today }) },
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
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
  ]);

  return summary.map((item) => ({
    class_id: item._id.toString(),
    class_name: item.class?.class_name,
    date: today,
    total_students: item.total,
    present_count: item.present,
    absent_count: item.absent,
    late_count: item.late,
  })) as unknown as ClassAttendanceDaily[];
}

export async function getClassAttendanceHistory(
  classId: string,
  startDate: string,
  endDate: string
): Promise<ClassAttendanceDaily[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!(await classBelongsToWorkspace(classId, context))) return [];

  const summary = await AttendanceModel.aggregate([
    {
      $match: workspaceFilter(context, {
        class_id: new mongoose.Types.ObjectId(classId),
        date: { $gte: startDate, $lte: endDate },
      }),
    },
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

  return summary.map((item) => ({
    class_id: classId,
    date: item._id,
    total_students: item.total,
    present_count: item.present,
    absent_count: item.absent,
    late_count: item.late,
  })) as unknown as ClassAttendanceDaily[];
}

export async function getAttendanceStats(): Promise<{
  totalMarkedToday: number;
  presentToday: number;
  absentToday: number;
  overallAttendanceRate: number;
}> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [todayRecords, monthRecords] = await Promise.all([
    AttendanceModel.find(workspaceFilter(context, { date: today })).select('status').lean(),
    AttendanceModel.find(workspaceFilter(context, { date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } })).select('status').lean(),
  ]);

  const totalMarkedToday = todayRecords.length;
  const presentToday = todayRecords.filter((record: any) => record.status === 'present' || record.status === 'late').length;
  const absentToday = todayRecords.filter((record: any) => record.status === 'absent').length;
  const totalMonth = monthRecords.length;
  const presentMonth = monthRecords.filter((record: any) => record.status === 'present' || record.status === 'late').length;
  const overallAttendanceRate = totalMonth > 0 ? Math.round((presentMonth / totalMonth) * 100) : 0;

  return { totalMarkedToday, presentToday, absentToday, overallAttendanceRate };
}

export async function deleteAttendance(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const deleted = await AttendanceModel.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!deleted) return { success: false, error: 'Attendance record not found.' };
    revalidatePath('/attendance');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting attendance:', error);
    return { success: false, error: error.message };
  }
}

export async function getStudentAttendanceHistory(studentId: string, limit = 50): Promise<any[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(studentId)) return [];
  const student = await Student.exists(workspaceFilter(context, { _id: studentId }));
  if (!student) return [];

  const records = await AttendanceModel.find(workspaceFilter(context, { student_id: studentId }))
    .sort({ date: -1 })
    .limit(limit)
    .populate('class_id', 'class_name subject')
    .lean({ virtuals: true });

  return (records as any[]).map((record) => ({
    id: record._id.toString(),
    date: record.date,
    status: record.status,
    notes: record.notes,
    classes: { class_name: record.class_id?.class_name, subject: record.class_id?.subject },
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
  const context = await requireWorkspaceContext();

  if (!(await classBelongsToWorkspace(classId, context))) {
    return { success: false, message: 'Class not found' };
  }

  const student = await Student.findOne(
    workspaceFilter(context, { $or: [{ barcode }, { student_code: barcode }] })
  ).lean({ virtuals: true });
  if (!student) return { success: false, message: 'Student not found' };

  const studentData = student as any;
  const enrollment = await Enrollment.findOne(
    workspaceFilter(context, { student_id: studentData._id, class_id: classId, status: 'active' })
  );
  if (!enrollment) return { success: false, message: 'Not enrolled in class', studentName: studentData.full_name };

  try {
    await AttendanceModel.findOneAndUpdate(
      workspaceFilter(context, { class_id: classId, student_id: studentData._id, date }),
      {
        workspace_id: workspaceValue(context),
        class_id: classId,
        student_id: studentData._id,
        date,
        status: 'present',
        marked_by: context.user.id,
      },
      { upsert: true, new: true }
    );

    revalidatePath('/attendance');
    revalidatePath('/dashboard');
    return { success: true, message: 'Marked present', studentName: studentData.full_name };
  } catch {
    return { success: false, message: 'Failed to mark', studentName: studentData.full_name };
  }
}

export async function getAttendanceTrend(): Promise<Array<{ date: string; present: number; absent: number; late: number; total: number }>> {
  await connectDB();
  const context = await requireWorkspaceContext();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const records = await AttendanceModel.find(
    workspaceFilter(context, { date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] } })
  )
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
