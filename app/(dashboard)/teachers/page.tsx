import { getTeachers } from "@/lib/actions/teachers";
import { TeacherForm } from "@/components/teachers/TeacherForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeacherTable } from "@/components/teachers/TeacherTable";

export default async function TeachersPage() {
    const teachers = await getTeachers();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Teachers
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage faculty and staff members
                    </p>
                </div>
                <TeacherForm />
            </div>

            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle>Faculty Directory</CardTitle>
                    <CardDescription>
                        A list of all registered teachers in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TeacherTable teachers={teachers} />
                </CardContent>
            </Card>
        </div>
    );
}
