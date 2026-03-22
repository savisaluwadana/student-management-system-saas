'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import TutorialModel from '@/lib/mongodb/models/Tutorial';
import TutorialProgress from '@/lib/mongodb/models/TutorialProgress';
import { getCurrentUser } from '@/lib/auth/auth';
import mongoose from 'mongoose';

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

export async function getTutorials() {
  await connectDB();
  const tutorials = await TutorialModel.find({})
    .sort({ created_at: -1 })
    .populate('class_id', 'id class_name')
    .populate('institute_id', 'id name')
    .lean({ virtuals: true });

  return (tutorials as any[]).map((t) => ({
    ...t,
    id: t._id.toString(),
    classes: t.class_id ? { id: t.class_id?._id?.toString(), class_name: t.class_id?.class_name } : undefined,
    institutes: t.institute_id ? { id: t.institute_id?._id?.toString(), name: t.institute_id?.name } : undefined,
  })) as TutorialWithRelations[];
}

export async function getTutorialsByClass(classId: string) {
  await connectDB();
  const tutorials = await TutorialModel.find({ class_id: classId }).sort({ created_at: -1 }).lean({ virtuals: true });
  return (tutorials as any[]).map((t) => ({ ...t, id: t._id.toString() })) as Tutorial[];
}

export async function getTutorialById(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return null;

  const t = await TutorialModel.findById(id)
    .populate('class_id', 'id class_name')
    .populate('institute_id', 'id name')
    .lean({ virtuals: true });

  if (!t) return null;
  const tutorial = t as any;
  return {
    ...tutorial,
    id: tutorial._id.toString(),
    classes: tutorial.class_id ? { id: tutorial.class_id?._id?.toString(), class_name: tutorial.class_id?.class_name } : undefined,
    institutes: tutorial.institute_id ? { id: tutorial.institute_id?._id?.toString(), name: tutorial.institute_id?.name } : undefined,
  } as TutorialWithRelations;
}

export async function getTutorialStats() {
  await connectDB();
  const total = await TutorialModel.countDocuments();
  return { total };
}

export async function createTutorial(formData: FormData) {
  await connectDB();
  const user = await getCurrentUser();

  const classId = formData.get('class_id') as string;
  const instituteId = formData.get('institute_id') as string;

  const tutorialData: any = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    content_url: formData.get('content_url') as string || null,
    content_type: formData.get('content_type') as string || null,
    class_id: (classId && classId !== 'none') ? classId : null,
    institute_id: (instituteId && instituteId !== 'none') ? instituteId : null,
    is_public: formData.get('is_public') === 'true',
    created_by: user?.id || null,
  };

  try {
    const tutorial = await TutorialModel.create(tutorialData);
    revalidatePath('/tutorials');
    return { success: true, data: { ...tutorialData, id: tutorial._id.toHexString() } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTutorial(id: string, formData: FormData) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  const classId = formData.get('class_id') as string;
  const instituteId = formData.get('institute_id') as string;

  const tutorialData = {
    title: formData.get('title') as string,
    description: formData.get('description') as string || null,
    content_url: formData.get('content_url') as string || null,
    content_type: formData.get('content_type') as string || null,
    class_id: (classId && classId !== 'none') ? classId : null,
    institute_id: (instituteId && instituteId !== 'none') ? instituteId : null,
    is_public: formData.get('is_public') === 'true',
  };

  try {
    const tutorial = await TutorialModel.findByIdAndUpdate(id, tutorialData, { new: true }).lean({ virtuals: true });
    revalidatePath('/tutorials');
    return { success: true, data: tutorial };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTutorial(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await TutorialModel.findByIdAndDelete(id);
    await TutorialProgress.deleteMany({ tutorial_id: id });
    revalidatePath('/tutorials');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentTutorialProgress(studentId: string) {
  await connectDB();

  const progress = await TutorialProgress.find({ student_id: studentId })
    .populate('tutorial_id', 'id title content_type')
    .lean({ virtuals: true });

  return (progress as any[]).map((p) => ({
    ...p,
    id: p._id.toString(),
    tutorials: {
      id: p.tutorial_id?._id?.toString(),
      title: p.tutorial_id?.title,
      content_type: p.tutorial_id?.content_type,
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

  const progressData: any = {
    tutorial_id: tutorialId,
    student_id: studentId,
    status,
    progress_percentage: progressPercentage || (status === 'completed' ? 100 : 0),
  };

  if (status === 'in_progress') progressData.started_at = new Date();
  if (status === 'completed') {
    progressData.completed_at = new Date();
    progressData.progress_percentage = 100;
  }

  try {
    const result = await TutorialProgress.findOneAndUpdate(
      { tutorial_id: tutorialId, student_id: studentId },
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

  const summary = await TutorialProgress.aggregate([
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
    { $unwind: { path: '$tutorial', preserveNullAndEmpty: true } },
    { $lookup: { from: 'classes', localField: 'tutorial.class_id', foreignField: '_id', as: 'class' } },
    { $unwind: { path: '$class', preserveNullAndEmpty: true } },
  ]);

  return summary.map((s) => ({
    tutorial_id: s._id.toString(),
    title: s.tutorial?.title,
    class_id: s.tutorial?.class_id?.toString(),
    class_name: s.class?.class_name,
    total_students: s.total_students,
    completed_count: s.completed_count,
    in_progress_count: s.in_progress_count,
    not_started_count: s.not_started_count,
    completion_percentage: s.total_students > 0 ? Math.round((s.completed_count / s.total_students) * 100) : 0,
  })) as TutorialProgressSummary[];
}
