import { requireWorkspaceContext } from '@/lib/saas/workspace';
import { getPendingTeacherInvites, getTeachers } from '@/lib/actions/teachers';
import { TeacherForm } from '@/components/teachers/TeacherForm';
import { PendingInvites } from '@/components/teachers/PendingInvites';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TeacherTable } from '@/components/teachers/TeacherTable';

export default async function TeachersPage() {
  const context = await requireWorkspaceContext();
  const isAdmin = context.user.role === 'admin';
  const [teachers, pendingInvites] = await Promise.all([
    getTeachers(),
    isAdmin ? getPendingTeacherInvites() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Teachers</h1>
          <p className="mt-1 text-muted-foreground">
            {isAdmin ? 'Manage faculty, invitations and class access.' : 'View faculty and class assignments.'}
          </p>
        </div>
        {isAdmin ? <TeacherForm /> : null}
      </div>

      {isAdmin ? <PendingInvites invites={pendingInvites} /> : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Faculty directory</CardTitle>
          <CardDescription>
            Teachers who have accepted their invitation and joined this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherTable teachers={teachers} canManage={isAdmin} />
        </CardContent>
      </Card>
    </div>
  );
}
