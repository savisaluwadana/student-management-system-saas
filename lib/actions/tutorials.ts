'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import TutorialModel from '@/lib/mongodb/models/Tutorial';
import TutorialProgress from '@/lib/mongodb/models/TutorialProgress';
import Class from '@/lib/mongodb/models/Class';
import Institute from '@/lib/mongodb/models/Institute';
import Student from '@/lib/mongodb/models/Student';
import mongoose from 'mongoose';
import { requireWorkspaceContext, workspaceFilter, workspaceValue, type WorkspaceContext } from '@/lib/saas/workspace';

export interface Tutorial {
  id: string;
  title: string;
  description?: string;
  content_url?: string;
  content_type?: 'video' | 'document' | 'link' | 'other';
  class_id?: string;
  institute_id?: string;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TutorialWithRelations extends Tutorial {
  classes?: { id: string; class_name: string };
  institutes?: { id: string; name: string };
}

export interface TutorialProgressType {
  id: string;
  tutorial_id: string;
  student_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
}

export interface TutorialProgressSummary {
  tutorial_id: string;
  title: string;
  class_id?: string;
  class_name?: string;
  total_students: number;
  completed_count: number;
  in_progress_count: number;
  not_started_count: number;
  completion_percentage: number;
}

async function validateTutorialRelations(classId: string | null, instituteId: string | null, context: WorkspaceContext) {
  if (classId) {
    if (!mongoose.isValidObjectId(classId)) return 'Invalid class.';
    const exists = await Class.exists(workspaceFilter(context, { _id: classId }));
    if (!exists) return 'Class does not belong to this workspace.';
  }
  if (instituteId) {
    if (!mongoose.isValidObjectId(instituteId)) return 'Invalid institute.';
    const exists = await Institute.exists(workspaceFilter(context, { _id: instituteId }));
    if (!exists) return 'Institute does not belong to this workspace.';
  }
  return null;
}

export async function getTutorials() {
  await connectDB();
  const context = await requireWorkspaceContext();
  const tutorials = await TutorialModel.find(workspaceFilter(context, {}))
    .sort({ created_at: -1 })
    .populate('class_id', 'id class_name')
    .populate('institute_id', 'id name')
    .lean({ virtuals: true });

  return (tutorials as any[]).map((tutorial) => ({
    ...tutorial,
    id: tutorial._id.toString(),
    classes: tutorial.class_id ? { id: tutorial.class_id?._id?.toString(), class_name: tutorial.class_id?.class_name } : undefined,
    institutes: tutorial.institute_id ? { id: tutorial.institute_id?._id?.toString(), name: tutorial.institute_id?.name } : undefined,
  })) as TutorialWithRelations[];
}

export async function getTutorialsByClass(classId: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(classId)) return [];
  const classExists = await Class.exists(workspaceFilter(context, { _id: classId }));
  if (!classExists) return [];

  const tutorials = await TutorialModel.find(workspaceFilter(context, { class_id: classId }))
    .sort({ created_at: -1 })
    .lean({ virtuals: true });
  return (tutorials as any[]).map((tutorial) => ({ ...tutorial, id: tutorial._id.toString() })) as Tutorial[];
}

export async function getTutorialById(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return null;

  const result = await TutorialModel.findOne(workspaceFilter(context, { _id: id }))
    .populate('class_id', 'id class_name')
    .populate('institute_id', 'id name')
    .lean({ virtuals: true });

  if (!result) return null;
  const tutorial = result as any;
  return {
    ...tutorial,
    id: tutorial._id.toString(),
    classes: tutorial.class_id ? { id: tutorial.class_id?._id?.toString(), class_name: tutorial.class_id?.class_name } : undefined,
    institutes: tutorial.institute_id ? { id: tutorial.institute_id?._id?.toString(), name: tutorial.institute_id?.name } : undefined,
  } as TutorialWithRelations;
}

export async function getTutorialStats() {
  await connectDB();
  const context = await requireWorkspaceContext();
  const total = await TutorialModel.countDocuments(workspaceFilter(context, {}));
  return { total };
}

export async function createTutorial(formData: FormData) {
  await connectDB();
  const context = await requireWorkspaceContext();

  const rawClassId = formData.get('class_id') as string;
  const rawInstituteId = formData.get('institute_id') as string;
  const classId = rawClassId && rawClassId !== 'none' ? rawClassId : null;
  const instituteId = rawInstituteId && rawInstituteId !== 'none' ? rawInstituteId : null;

  const relationError = await validateTutorialRelations(classId, instituteId, context);
  if (relationError) return { success: false, error: relationError };

  const tutorialData: any = {
    workspace_id: workspaceValue(context),
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    content_url: (formData.get('content_url') as string) || null,
    content_type: (formData.get('content_type') as string) || null,
    class_id: classId,
    institute_id: instituteId,
    is_public: formData.get('is_public') === 'true',
    created_by: context.user.id,
  };

  try {
    const tutorial = await TutorialModel.create(tutorialData);
    revalidatePath('/tutorials');
    revalidatePath('/dashboard');
    return { success: true, data: { ...tutorialData, id: tutorial._id.toHexString() } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTutorial(id: string, formData: FormData) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const rawClassId = formData.get('class_id') as string;
  const rawInstituteId = formData.get('institute_id') as string;
  const classId = rawClassId && rawClassId !== 'none' ? rawClassId : null;
  const instituteId = rawInstituteId && rawInstituteId !== 'none' ? rawInstituteId : null;

  const relationError = await validateTutorialRelations(classId, instituteId, context);
  if (relationError) return { success: false, error: relationError };

  const tutorialData = {
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    content_url: (formData.get('content_url') as string) || null,
    content_type: (formData.get('content_type') as string) || null,
    class_id: classId,
    institute_id: instituteId,
    is_public: formData.get('is_public') === 'true',
  };

  try {
    const tutorial = await TutorialModel.findOneAndUpdate(
      workspaceFilter(context, { _id: id }),
      tutorialData,
      { new: true }
    ).lean({ virtuals: true });
    if (!tutorial) return { success: false, error: 'Tutorial not found.' };
    revalidatePath('/tutorials');
    return { success: true, data: tutorial };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTutorial(id: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    const tutorial = await TutorialModel.findOneAndDelete(workspaceFilter(context, { _id: id }));
    if (!tutorial) return { success: false, error: 'Tutorial not found.' };
    await TutorialProgress.deleteMany(workspaceFilter(context, { tutorial_id: id }));
    revalidatePath('/tutorials');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentTutorialProgress(studentId: string) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(studentId)) return [];
  const student = await Student.exists(workspaceFilter(context, { _id: studentId }));
  if (!student) return [];

  const progress = await TutorialProgress.find(workspaceFilter(context, { student_id: studentId }))
    .populate('tutorial_id', 'id title content_type')
    .lean({ virtuals: true });

  return (progress as any[]).map((item) => ({
    ...item,
    id: item._id.toString(),
    tutorials: {
      id: item.tutorial_id?._id?.toString(),
      title: item.tutorial_id?.title,
      content_type: item.tutorial_id?.content_type,
    },
  }));
}

export async function updateTutorialProgress(
  tutorialId: string,
  studentId: string,
  status: 'not_started' | 'in_progress' | 'completed',
  progressPercentage?: number
) {
  await connectDB();
  const context = await requireWorkspaceContext();
  if (!mongoose.isValidObjectId(tutorialId) || !mongoose.isValidObjectId(studentId)) {
    return { success: false, error: 'Invalid tutorial or student.' };
  }

  const [tutorial, student] = await Promise.all([
    TutorialModel.exists(workspaceFilter(context, { _id: tutorialId })),
    Student.exists(workspaceFilter(context, { _id: studentId })),
  ]);
  if (!tutorial || !student) return { success: false, error: 'Tutorial or student not found in this workspace.' };

  const progressData: any = {
    workspace_id: workspaceValue(context),
    tutorial_id: tutorialId,
    student_id: studentId,
    status,
    progress_percentage: progressPercentage ?? (status === 'completed' ? 100 : 0),
  };

  if (status === 'in_progress') progressData.started_at = new Date();
  if (status === 'completed') {
    progressData.completed_at = new Date();
    progressData.progress_percentage = 100;
  }

  try {
    const result = await TutorialProgress.findOneAndUpdate(
      workspaceFilter(context, { tutorial_id: tutorialId, student_id: studentId }),
      progressData,
      { upsert: true, new: true }
    );
    revalidatePath('/tutorials');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTutorialProgressSummary() {
  await connectDB();
  const context = await requireWorkspaceContext();

  const summary = await TutorialProgress.aggregate([
    { $match: workspaceFilter(context, {}) },
    {
      $group: {
        _id: '$tutorial_id',
        total_students: { $sum: 1 },
        completed_count: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        in_progress_count: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
        not_started_count: { $sum: { $cond: [{ $eq: ['$status', 'not_started'] }, 1, 0] } },
      },
    },
    { $lookup: { from: 'tutorials', localField: '_id', foreignField: '_id', as: 'tutorial' } },
    { $unwind: { path: '$tutorial', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'classes', localField: 'tutorial.class_id', foreignField: '_id', as: 'class' } },
    { $unwind: { path: '$class', preserveNullAndEmptyArrays: true } },
  ]);

  return summary.map((item) => ({
    tutorial_id: item._id.toString(),
    title: item.tutorial?.title,
    class_id: item.tutorial?.class_id?.toString(),
    class_name: item.class?.class_name,
    total_students: item.total_students,
    completed_count: item.completed_count,
    in_progress_count: item.in_progress_count,
    not_started_count: item.not_started_count,
    completion_percentage: item.total_students > 0 ? Math.round((item.completed_count / item.total_students) * 100) : 0,
  })) as TutorialProgressSummary[];
}
