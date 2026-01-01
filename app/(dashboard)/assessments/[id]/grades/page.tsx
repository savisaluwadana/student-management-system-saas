import { getAssessmentById, getStudentsForGrading } from '@/lib/actions/assessments';
import { GradeEntryForm } from '@/components/assessments/GradeEntryForm';
import { notFound } from 'next/navigation';

interface GradeEntryPageProps {
    params: { id: string };
}

export default async function GradeEntryPage({ params }: GradeEntryPageProps) {
    const [assessment, students] = await Promise.all([
        getAssessmentById(params.id),
        getStudentsForGrading(params.id),
    ]);

    if (!assessment) {
        notFound();
    }

    return <GradeEntryForm assessment={assessment} students={students} />;
}
