"use client";

import { useState, useMemo, useCallback } from 'react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteTeacher, Teacher } from '@/lib/actions/teachers';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TeacherForm } from './TeacherForm';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface TeacherTableProps {
    teachers: Teacher[];
    canManage?: boolean;
}

export function TeacherTable({ teachers, canManage = false }: TeacherTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const handleDelete = async (id: string) => {
        if (!canManage) return;
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

    const filteredTeachers = useMemo(() => {
        if (!searchQuery.trim()) return teachers;
        const query = searchQuery.toLowerCase();
        return teachers.filter(
            (teacher) =>
                teacher.full_name.toLowerCase().includes(query) ||
                teacher.email.toLowerCase().includes(query) ||
                teacher.phone?.toLowerCase().includes(query)
        );
    }, [teachers, searchQuery]);

    const totalPages = Math.ceil(filteredTeachers.length / pageSize);
    const paginatedTeachers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTeachers.slice(start, start + pageSize);
    }, [filteredTeachers, currentPage]);

    const handleSearchChange = useCallback((search: string) => {
        setSearchQuery(search);
        setCurrentPage(1);
    }, []);

    return (
        <div className="space-y-4">
            <SearchFilter
                placeholder="Search by name, email, or phone..."
                onSearchChange={handleSearchChange}
            />

            {paginatedTeachers.length === 0 ? (
                <div className="py-16 text-center">
                    <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <span className="text-xl font-semibold text-muted-foreground">T</span>
                    </div>
                    <h3 className="text-lg font-medium">No teachers found</h3>
                    <p className="mt-1 text-muted-foreground">
                        {searchQuery
                            ? 'Try adjusting your search.'
                            : canManage
                                ? 'Invite your first teacher to get started.'
                                : 'No teachers have joined this workspace yet.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-hidden rounded-lg border bg-white dark:bg-zinc-950">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[60px] font-semibold" />
                                    <TableHead className="font-semibold">Full Name</TableHead>
                                    <TableHead className="font-semibold">Email</TableHead>
                                    <TableHead className="font-semibold">Phone</TableHead>
                                    <TableHead className="font-semibold">Classes</TableHead>
                                    <TableHead className="font-semibold">Joined</TableHead>
                                    {canManage ? <TableHead className="text-right font-semibold">Actions</TableHead> : null}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTeachers.map((teacher) => (
                                    <TableRow key={teacher.id} className="transition-colors hover:bg-muted/30">
                                        <TableCell>
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarFallback>
                                                    {teacher.full_name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/teachers/${teacher.id}`} className="font-medium transition-colors hover:text-primary">
                                                {teacher.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                                        <TableCell className="text-muted-foreground">{teacher.phone || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.classes && teacher.classes.length > 0 ? (
                                                    teacher.classes.map((classItem) => (
                                                        <Badge key={classItem.id} variant="outline" className="text-xs">
                                                            {classItem.class_name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs italic text-muted-foreground">No classes</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{formatDate(teacher.created_at)}</TableCell>
                                        {canManage ? (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <TeacherForm
                                                        teacher={teacher}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary" aria-label={`Edit ${teacher.full_name}`}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                        onSuccess={() => router.refresh()}
                                                    />
                                                    <ConfirmDialog
                                                        trigger={
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 hover:text-destructive"
                                                                aria-label={`Delete ${teacher.full_name}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                        title="Delete Teacher"
                                                        description={`Are you sure you want to delete "${teacher.full_name}"? Their associated classes will be unassigned.`}
                                                        actionLabel="Delete"
                                                        variant="destructive"
                                                        onConfirm={() => handleDelete(teacher.id)}
                                                        disabled={deletingId === teacher.id}
                                                    />
                                                </div>
                                            </TableCell>
                                        ) : null}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredTeachers.length)} of {filteredTeachers.length}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((page) => page - 1)} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="px-3 text-sm font-medium">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((page) => page + 1)} disabled={currentPage >= totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
