'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import AssessmentModel from '@/lib/mongodb/models/Assessment';
import Grade from '@/lib/mongodb/models/Grade';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Student from '@/lib/mongodb/models/Student';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import type {
  AssessmentWithClass,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  GradeWithStudent,
  BulkGradeInput,
  ClassAssessmentSummary,
  StudentForGrading,
} from '@/types/assessment.types';
import { requireWorkspaceContext, workspaceFilter, workspaceValue } from '@/lib/saas/workspace';

async function validateClass(classId: string | undefined, context: Awaited<ReturnType<typeof requireWorkspaceContext>>) {
  if (!classId || !mongoose.isValidObjectId(classId)) return false;
  return Boolean(await Class.exists(workspaceFilter(context, { _id: classId })));
}

export async function getAssessments(classId?: string): Promise<AssessmentWithClass[]> {
  await connectDB();
  const context = await requireWorkspaceContext();

  if (classId && !(await validateClass(classId, context))) return [];
  const filter = classId ? { class_id: classId } : {};
  const assessments = await AssessmentModel.find(workspaceFilter(context, filter))
    .sort({ date: -1 })
    .populate('class_id', 'id class_code class_name subject')
    .lean({ virtuals: true });

  return (assessments as any[]).map((assessment) => ({
    ...assessment,
    id: assessment._id.toString(),
    classes: {
      id: assessment.class_id?._id?.toString(),
      class_code: assessment.class_id?.class_code,
      class_name: assessment.class_id?.class_name,
      subject: assessment.class_id?.subject,
    },
  })) as unknown as AssessmentWithClass[];
}

export async function getAssessmentById(id: string): Promise<AssessmentWithClass | null> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;

  const assessment = await AssessmentModel.findOne(workspaceFilter(context, { _id: id }))
    .populate('class_id', 'id class_code class_name subject')
    .lean({ virtuals: true });

  if (!assessment) return null;
  const data = assessment as any;
  return {
    ...data,
    id: data._id.toString(),
    classes: {
      id: data.class_id?._id?.toString(),
      class_code: data.class_id?.class_code,
      class_name: data.class_id?.class_name,
      subject: data.class_id?.subject,
    },
  } as unknown as AssessmentWithClass;
}

export async function createAssessment(input: CreateAssessmentInput): Promise<{ success: boolean; error?: string; id?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();

  try {
    if (!(await validateClass(input.class_id, context))) {
      return { success: false, error: 'Class does not belong to this workspace.' };
    }

    const assessment = await AssessmentModel.create({
      ...input,
      workspace_id: workspaceValue(context),
      created_by: context.user.id,
    });
    revalidatePath('/assessments');
    return { success: true, id: assessment._id.toHexString() };
  } catch (error: any) {
    console.error('Error creating assessment:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAssessment(id: string, input: UpdateAssessmentInput): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    if (input.class_id && !(await validateClass(input.class_id, context))) {
      return { success: false, error: 'Class does not belong to this workspace.' };
    }

    const updated = await AssessmentModel.findOneAndUpdate(workspaceFilter(context, { _id: id }), input, { new: true });
    if (!updated) return { success: false, error: 'Assessment not found.' };
    revalidatePath('/assessments');
    revalidatePath(`/assessments/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAssessment(id: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const deleted = await AssessmentModel.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!deleted) return { success: false, error: 'Assessment not found.' };
    await Grade.deleteMany(workspaceFilter(context, { assessment_id: id }));
    revalidatePath('/assessments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentsForGrading(assessmentId: string): Promise<StudentForGrading[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(assessmentId)) return [];

  const assessment = await AssessmentModel.findOne(workspaceFilter(context, { _id: assessmentId })).select('class_id').lean();
  if (!assessment) return [];

  const enrollments = await Enrollment.find(workspaceFilter(context, { class_id: (assessment as any).class_id, status: 'active' }))
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  const existingGrades = await Grade.find(workspaceFilter(context, { assessment_id: assessmentId }))
    .select('student_id score remarks')
    .lean();
  const gradesMap = new Map((existingGrades as any[]).map((grade) => [grade.student_id.toString(), grade]));

  return (enrollments as any[]).map((enrollment) => ({
    student_id: enrollment.student_id?._id?.toString(),
    student_code: enrollment.student_id?.student_code,
    full_name: enrollment.student_id?.full_name,
    current_score: gradesMap.get(enrollment.student_id?._id?.toString())?.score,
    current_remarks: gradesMap.get(enrollment.student_id?._id?.toString())?.remarks,
  })) as unknown as StudentForGrading[];
}

export async function saveGrades(input: BulkGradeInput): Promise<{ success: boolean; error?: string; count?: number }> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(input.assessment_id)) return { success: false, error: 'Invalid assessment.' };

  const assessment = await AssessmentModel.findOne(workspaceFilter(context, { _id: input.assessment_id })).select('class_id max_score').lean();
  if (!assessment) return { success: false, error: 'Assessment not found.' };

  const validGrades = input.grades.filter((grade) => grade.score !== null || grade.remarks);
  if (validGrades.length === 0) return { success: true, count: 0 };

  const studentIds = Array.from(new Set(validGrades.map((grade) => grade.student_id)));
  if (studentIds.some((id) => !mongoose.isValidObjectId(id))) return { success: false, error: 'Invalid student.' };

  const enrolledCount = await Enrollment.countDocuments(workspaceFilter(context, {
    class_id: (assessment as any).class_id,
    student_id: { $in: studentIds },
    status: 'active',
  }));
  if (enrolledCount !== studentIds.length) {
    return { success: false, error: 'One or more students are not enrolled in this workspace class.' };
  }

  const maxScore = Number((assessment as any).max_score || 0);
  if (validGrades.some((grade) => grade.score !== null && (Number(grade.score) < 0 || Number(grade.score) > maxScore))) {
    return { success: false, error: `Scores must be between 0 and ${maxScore}.` };
  }

  try {
    await Promise.all(validGrades.map((grade) =>
      Grade.findOneAndUpdate(
        workspaceFilter(context, { assessment_id: input.assessment_id, student_id: grade.student_id }),
        {
          workspace_id: workspaceValue(context),
          assessment_id: input.assessment_id,
          student_id: grade.student_id,
          score: grade.score,
          remarks: grade.remarks || null,
          graded_by: context.user.id,
          graded_at: new Date(),
        },
        { upsert: true, new: true }
      )
    ));

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
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(assessmentId)) return [];
  const assessment = await AssessmentModel.exists(workspaceFilter(context, { _id: assessmentId }));
  if (!assessment) return [];

  const grades = await Grade.find(workspaceFilter(context, { assessment_id: assessmentId }))
    .populate('student_id', 'id student_code full_name')
    .lean({ virtuals: true });

  return (grades as any[]).map((grade) => ({
    ...grade,
    id: grade._id.toString(),
    students: {
      id: grade.student_id?._id?.toString(),
      student_code: grade.student_id?.student_code,
      full_name: grade.student_id?.full_name,
    },
  })) as unknown as GradeWithStudent[];
}

export async function getClassAssessmentSummary(classId: string): Promise<ClassAssessmentSummary[]> {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!(await validateClass(classId, context))) return [];

  const assessments = await AssessmentModel.find(workspaceFilter(context, { class_id: classId }))
    .sort({ date: -1 })
    .lean({ virtuals: true });

  return await Promise.all((assessments as any[]).map(async (assessment) => {
    const grades = await Grade.find(workspaceFilter(context, { assessment_id: assessment._id })).lean();
    const scores = (grades as any[]).map((grade) => grade.score).filter((score) => score !== null && score !== undefined);
    const average = scores.length > 0 ? scores.reduce((sum: number, value: number) => sum + value, 0) / scores.length : null;
    return {
      assessment_id: assessment._id.toString(),
      class_id: classId,
      title: assessment.title,
      date: assessment.date,
      max_score: assessment.max_score,
      average_score: average,
      graded_count: scores.length,
    };
  })) as unknown as ClassAssessmentSummary[];
}

export async function getStudentReportCard(studentId: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(studentId)) return [];
  const student = await Student.exists(workspaceFilter(context, { _id: studentId }));
  if (!student) return [];

  const grades = await Grade.find(workspaceFilter(context, { student_id: studentId }))
    .populate({
      path: 'assessment_id',
      select: 'title date max_score class_id',
      populate: { path: 'class_id', select: 'class_name' },
    })
    .lean({ virtuals: true });

  return (grades as any[]).map((grade) => ({
    grade_id: grade._id.toString(),
    student_id: studentId,
    assessment_id: grade.assessment_id?._id?.toString(),
    assessment_title: grade.assessment_id?.title,
    assessment_date: grade.assessment_id?.date,
    max_score: grade.assessment_id?.max_score,
    score: grade.score,
    class_name: grade.assessment_id?.class_id?.class_name,
  }));
}
