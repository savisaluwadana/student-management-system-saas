'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import AssessmentModel from '@/lib/mongodb/models/Assessment';
import Grade from '@/lib/mongodb/models/Grade';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import { getCurrentUser } from '@/lib/auth/auth';
import mongoose from 'mongoose';
import type {
  Assessment,
  AssessmentWithClass,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  Grade as GradeType,
  GradeWithStudent,
  BulkGradeInput,
  ClassAssessmentSummary,
  StudentForGrading,
} from '@/types/assessment.types';

export async function getAssessments(classId?: string): Promise<AssessmentWithClass[]> {
  await connectDB();

  const filter: any = {};
  if (classId) filter.class_id = classId;

  const assessments = await AssessmentModel.find(filter)
    .sort({ date: -1 })
    .populate('class_id', 'id class_code class_name subject')
    .lean({ virtuals: true });

  return (assessments as any[]).map((a) => ({
    ...a,
    id: a._id.toString(),
    classes: {
      id: a.class_id?._id?.toString(),
      class_code: a.class_id?.class_code,
      class_name: a.class_id?.class_name,
      subject: a.class_id?.subject,
    },
  })) as unknown as AssessmentWithClass[];
}

export async function getAssessmentById(id: string): Promise<AssessmentWithClass | null> {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;

  const assessment = await AssessmentModel.findById(id)
    .populate('class_id', 'id class_code class_name subject')
    .lean({ virtuals: true });

  if (!assessment) return null;
  const a = assessment as any;
  return {
    ...a,
    id: a._id.toString(),
    classes: {
      id: a.class_id?._id?.toString(),
      class_code: a.class_id?.class_code,
      class_name: a.class_id?.class_name,
      subject: a.class_id?.subject,
    },
  } as unknown as AssessmentWithClass;
}

export async function createAssessment(
  input: CreateAssessmentInput
): Promise<{ success: boolean; error?: string; id?: string }> {
  await connectDB();
  const user = await getCurrentUser();

  try {
    const assessment = await AssessmentModel.create({ ...input, created_by: user?.id });
    revalidatePath('/assessments');
    return { success: true, id: assessment._id.toHexString() };
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAssessment(
  id: string,
  input: UpdateAssessmentInput
): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await AssessmentModel.findByIdAndUpdate(id, input);
    revalidatePath('/assessments');
    revalidatePath(`/assessments/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await AssessmentModel.findByIdAndDelete(id);
    await Grade.deleteMany({ assessment_id: id });
    revalidatePath('/assessments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentsForGrading(assessmentId: string): Promise<StudentForGrading[]> {
  await connectDB();

  const assessment = await AssessmentModel.findById(assessmentId).select('class_id').lean();
  if (!assessment) return [];

  const enrollments = await Enrollment.find({ class_id: (assessment as any).class_id, status: 'active' })
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  const existingGrades = await Grade.find({ assessment_id: assessmentId }).select('student_id score remarks').lean();
  const gradesMap = new Map((existingGrades as any[]).map((g) => [g.student_id.toString(), g]));

  return (enrollments as any[]).map((e) => ({
    student_id: e.student_id?._id?.toString(),
    student_code: e.student_id?.student_code,
    full_name: e.student_id?.full_name,
    current_score: gradesMap.get(e.student_id?._id?.toString())?.score,
    current_remarks: gradesMap.get(e.student_id?._id?.toString())?.remarks,
  })) as unknown as StudentForGrading[];
}

export async function saveGrades(
  input: BulkGradeInput
): Promise<{ success: boolean; error?: string; count?: number }> {
  await connectDB();
  const user = await getCurrentUser();

  const validGrades = input.grades.filter((g) => g.score !== null || g.remarks);
  if (validGrades.length === 0) return { success: true, count: 0 };

  try {
    await Promise.all(
      validGrades.map((g) =>
        Grade.findOneAndUpdate(
          { assessment_id: input.assessment_id, student_id: g.student_id },
          {
            assessment_id: input.assessment_id,
            student_id: g.student_id,
            score: g.score,
            remarks: g.remarks || null,
            graded_by: user?.id,
            graded_at: new Date(),
          },
          { upsert: true, new: true }
        )
      )
    );

    revalidatePath('/assessments');
    revalidatePath(`/assessments/${input.assessment_id}`);
    return { success: true, count: validGrades.length };
  } catch (error: any) {
    console.error('Error saving grades:', error);
    return { success: false, error: error.message };
  }
}

export async function getGradesForAssessment(assessmentId: string): Promise<GradeWithStudent[]> {
  await connectDB();

  const grades = await Grade.find({ assessment_id: assessmentId })
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  return (grades as any[]).map((g) => ({
    ...g,
    id: g._id.toString(),
    students: {
      id: g.student_id?._id?.toString(),
      student_code: g.student_id?.student_code,
      full_name: g.student_id?.full_name,
    },
  })) as unknown as GradeWithStudent[];
}

export async function getClassAssessmentSummary(classId: string): Promise<ClassAssessmentSummary[]> {
  await connectDB();

  const assessments = await AssessmentModel.find({ class_id: classId }).sort({ date: -1 }).lean({ virtuals: true });

  return await Promise.all(
    (assessments as any[]).map(async (a) => {
      const grades = await Grade.find({ assessment_id: a._id }).lean();
      const scores = (grades as any[]).map((g) => g.score).filter((s) => s !== null && s !== undefined);
      const avg = scores.length > 0 ? scores.reduce((s: number, v: number) => s + v, 0) / scores.length : null;
      return {
        assessment_id: a._id.toString(),
        class_id: classId,
        title: a.title,
        date: a.date,
        max_score: a.max_score,
        average_score: avg,
        graded_count: scores.length,
      };
    })
  ) as unknown as ClassAssessmentSummary[];
}

export async function getStudentReportCard(studentId: string) {
  await connectDB();

  const grades = await Grade.find({ student_id: studentId })
    .populate({
      path: 'assessment_id',
      select: 'title date max_score class_id',
      populate: { path: 'class_id', select: 'class_name' },
    })
    .lean({ virtuals: true });

  return (grades as any[]).map((g) => ({
    grade_id: g._id.toString(),
    student_id: studentId,
    assessment_id: g.assessment_id?._id?.toString(),
    assessment_title: g.assessment_id?.title,
    assessment_date: g.assessment_id?.date,
    max_score: g.assessment_id?.max_score,
    score: g.score,
    class_name: g.assessment_id?.class_id?.class_name,
  }));
}
