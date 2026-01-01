import { getStudents } from '@/lib/actions/students';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Upload, Download } from 'lucide-react';
import { StudentTable } from '@/components/students/StudentTable';
import { ExportStudentsButton } from '@/components/students/ExportStudentsButton';

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage your students</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportStudentsButton />
          <Link href="/students/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>
          <Link href="/students/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            A list of all students in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentTable students={students} />
        </CardContent>
      </Card>
    </div>
  );
}
