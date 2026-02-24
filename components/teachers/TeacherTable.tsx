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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeacherForm } from './TeacherForm';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface TeacherTableProps {
    teachers: Teacher[];
}

export function TeacherTable({ teachers }: TeacherTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const handleDelete = async (id: string) => {
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
            (t) =>
                t.full_name.toLowerCase().includes(query) ||
                t.email.toLowerCase().includes(query) ||
                t.phone?.toLowerCase().includes(query)
        );
    }, [teachers, searchQuery]);

    const totalPages = Math.ceil(filteredTeachers.length / pageSize);
    const paginatedTeachers = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredTeachers.slice(start, start + pageSize);
    }, [filteredTeachers, currentPage, pageSize]);

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
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <span className="text-2xl">👨‍🏫</span>
                    </div>
                    <h3 className="text-lg font-medium">No teachers found</h3>
                    <p className="text-muted-foreground mt-1">
                        {searchQuery
                            ? 'Try adjusting your search.'
                            : 'Add your first teacher to get started.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="rounded-lg border bg-white dark:bg-zinc-950 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="w-[60px] font-semibold"></TableHead>
                                    <TableHead className="font-semibold">Full Name</TableHead>
                                    <TableHead className="font-semibold">Email</TableHead>
                                    <TableHead className="font-semibold">Phone</TableHead>
                                    <TableHead className="font-semibold">Classes</TableHead>
                                    <TableHead className="font-semibold">Joined</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedTeachers.map((teacher) => (
                                    <TableRow key={teacher.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacher.full_name}`} alt={teacher.full_name} />
                                                <AvatarFallback>{teacher.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/teachers/${teacher.id}`} className="font-medium hover:text-primary transition-colors">
                                                {teacher.full_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{teacher.email}</TableCell>
                                        <TableCell className="text-muted-foreground">{teacher.phone || '-'}</TableCell>
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
                                        <TableCell className="text-muted-foreground">{formatDate(teacher.created_at)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <TeacherForm
                                                    teacher={teacher}
                                                    trigger={
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
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
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium px-3">Page {currentPage} of {totalPages}</span>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= totalPages}>
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
