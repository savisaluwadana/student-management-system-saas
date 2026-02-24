"use client";

import { useState, useMemo, useCallback } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { deleteClass } from '@/lib/actions/classes';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Class } from '@/types/class.types';
import { ClassForm } from './ClassForm';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface ClassTableProps {
    classes: Class[];
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'completed', label: 'Completed' },
];

export function ClassTable({ classes }: ClassTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const result = await deleteClass(id);

        if (result.success) {
            toast({
                title: 'Class Deleted',
                description: 'Class has been removed.',
            });
            router.refresh();
        } else {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error || 'Failed to delete class',
            });
        }
        setDeletingId(null);
    };

    const filteredClasses = useMemo(() => {
        let result = classes;
        if (statusFilter !== 'all') {
            result = result.filter((c) => c.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (c) =>
                    c.class_name.toLowerCase().includes(query) ||
                    c.class_code.toLowerCase().includes(query) ||
                    c.subject.toLowerCase().includes(query)
            );
        }
        return result;
    }, [classes, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredClasses.length / pageSize);
    const paginatedClasses = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredClasses.slice(start, start + pageSize);
    }, [filteredClasses, currentPage, pageSize]);

    const handleSearchChange = useCallback((search: string) => {
        setSearchQuery(search);
        setCurrentPage(1);
    }, []);

    const handleFilterChange = useCallback((filter: string) => {
        setStatusFilter(filter);
        setCurrentPage(1);
    }, []);

    return (
        <div className="space-y-4">
            <SearchFilter
                placeholder="Search by name, code, or subject..."
                filterOptions={STATUS_OPTIONS}
                filterLabel="Status"
                onSearchChange={handleSearchChange}
                onFilterChange={handleFilterChange}
            />

            {paginatedClasses.length === 0 ? (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <span className="text-2xl">📚</span>
                    </div>
                    <h3 className="text-lg font-medium">No classes found</h3>
                    <p className="text-muted-foreground mt-1">
                        {searchQuery || statusFilter !== 'all'
                            ? 'Try adjusting your search or filter.'
                            : 'Create your first class to get started.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="rounded-lg border bg-white dark:bg-zinc-950 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Code</TableHead>
                                    <TableHead className="font-semibold">Name</TableHead>
                                    <TableHead className="font-semibold">Subject</TableHead>
                                    <TableHead className="font-semibold">Monthly Fee</TableHead>
                                    <TableHead className="font-semibold">Capacity</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="text-right font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedClasses.map((cls) => (
                                    <TableRow key={cls.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-mono text-sm font-medium">{cls.class_code}</TableCell>
                                        <TableCell>
                                            <Link href={`/classes/${cls.id}`} className="font-medium hover:text-primary transition-colors">
                                                {cls.class_name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{cls.subject}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(cls.monthly_fee)}</TableCell>
                                        <TableCell>{cls.capacity}</TableCell>
                                        <TableCell>
                                            <Badge variant={cls.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                                {cls.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/classes/${cls.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <ClassForm
                                                    initialData={cls}
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
                                                    title="Delete Class"
                                                    description={`Are you sure you want to delete "${cls.class_name}"? This will remove all associated enrollments and data.`}
                                                    actionLabel="Delete"
                                                    variant="destructive"
                                                    onConfirm={() => handleDelete(cls.id)}
                                                    disabled={deletingId === cls.id}
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
                                Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredClasses.length)} of {filteredClasses.length}
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
