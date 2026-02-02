import { getStudentById } from '@/lib/actions/students';
import { getStudentAttendanceHistory } from '@/lib/actions/attendance';
import { getStudentReportCard } from '@/lib/actions/assessments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentForm } from '@/components/students/StudentForm';
import { StudentAttendanceView } from '@/components/students/StudentAttendanceView';
import { StudentGradesView } from '@/components/students/StudentGradesView';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const student = await getStudentById(params.id);
  const attendanceHistory = await getStudentAttendanceHistory(params.id);
  const reportCard = await getStudentReportCard(params.id);

  if (!student) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {student.full_name}
        </h1>
        <p className="text-muted-foreground">{student.student_code} • {student.email || 'No email'}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="attendance">Attendance History</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
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
        </TabsContent>

        <TabsContent value="attendance">
          <StudentAttendanceView history={attendanceHistory} />
        </TabsContent>

        <TabsContent value="grades">
          <StudentGradesView grades={reportCard as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
