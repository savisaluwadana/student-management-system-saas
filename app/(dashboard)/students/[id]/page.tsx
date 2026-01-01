import { getStudentById } from '@/lib/actions/students';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentForm } from '@/components/students/StudentForm';
import { notFound } from 'next/navigation';

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await getStudentById(params.id);

  if (!student) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Student</h1>
        <p className="text-muted-foreground">Update student information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Update the details below to modify the student profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm student={student} />
        </CardContent>
      </Card>
    </div>
  );
}
