import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentForm } from '@/components/students/StudentForm';

export default function NewStudentPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Student</h1>
        <p className="text-muted-foreground">Create a new student profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new student
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentForm />
        </CardContent>
      </Card>
    </div>
  );
}
