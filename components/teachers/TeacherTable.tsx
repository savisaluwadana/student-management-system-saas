"use client";

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { deleteTeacher, Teacher } from '@/lib/actions/teachers';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TeacherTableProps {
    teachers: Teacher[];
}

export function TeacherTable({ teachers }: TeacherTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
            return;
        }

        setDeletingId(id);
        const result = await deleteTeacher(id);

        if (result.success) {
            toast({
                title: 'Teacher Deleted',
                description: 'Teacher account has been removed.',
            });
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to delete teacher',
            });
        }
        setDeletingId(null);
    };

    if (teachers.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No teachers found</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {teachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                        <TableCell>
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacher.full_name}`} alt={teacher.full_name} />
                                <AvatarFallback>{teacher.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{teacher.full_name}</TableCell>
                        <TableCell>{teacher.email}</TableCell>
                        <TableCell>{teacher.phone || '-'}</TableCell>
                        <TableCell>
                            <div className="flex flex-wrap gap-1">
                                {teacher.classes && teacher.classes.length > 0 ? (
                                    teacher.classes.map(c => (
                                        <Badge key={c.id} variant="outline" className="text-xs">
                                            {c.class_name}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground text-xs italic">No classes</span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>{formatDate(teacher.created_at)}</TableCell>
                        <TableCell>
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700">
                                Active
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" disabled>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(teacher.id)}
                                disabled={deletingId === teacher.id}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
