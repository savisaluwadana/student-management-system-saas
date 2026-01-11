
import { getClassById } from '@/lib/actions/classes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar, DollarSign, BookOpen } from 'lucide-react';
import { getTeacherById } from '@/lib/actions/teachers';

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
    const classData = await getClassById(params.id);

    if (!classData) {
        notFound();
    }

    // Fetch teacher details if assigned
    let teacher = null;
    if (classData.teacher_id) {
        teacher = await getTeacherById(classData.teacher_id);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/classes">
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Classes
                </Button>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold tracking-tight">{classData.class_name}</h1>
                        <Badge variant={classData.status === 'active' ? 'default' : 'secondary'}>
                            {classData.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{classData.class_code} • {classData.subject}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Fee</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(classData.monthly_fee)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Capacity</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{classData.capacity} Students</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Schedule</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-medium">{classData.schedule || 'Not scheduled'}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {classData.description || 'No description provided.'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Teacher</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {teacher ? (
                            <div className="flex items-center gap-4">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        <Link href={`/teachers/${teacher.id}`} className="hover:underline">
                                            {teacher.full_name}
                                        </Link>
                                    </p>
                                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No teacher assigned.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
