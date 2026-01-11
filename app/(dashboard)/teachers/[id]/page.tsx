
import { getTeacherById } from '@/lib/actions/teachers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
    const teacher = await getTeacherById(params.id);

    if (!teacher) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link href="/teachers">
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Teachers
                </Button>
            </Link>

            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-border">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacher.full_name}`} alt={teacher.full_name} />
                    <AvatarFallback className="text-2xl">{teacher.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{teacher.full_name}</h1>
                    <p className="text-muted-foreground">{teacher.email}</p>
                    <div className="flex gap-2 mt-2">
                        <Badge>Teacher</Badge>
                        <Badge variant="outline">Joined {formatDate(teacher.created_at)}</Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="font-medium">Email:</span> {teacher.email}
                        </div>
                        <div>
                            <span className="font-medium">Phone:</span> {teacher.phone || 'Not provided'}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Assigned Classes</CardTitle>
                        <CardDescription>Classes currently taught by this teacher</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teacher.classes && teacher.classes.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {teacher.classes.map(c => (
                                    <Link key={c.id} href={`/classes/${c.id}`}>
                                        <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                                            {c.class_name} ({c.class_code})
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">No classes assigned.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
