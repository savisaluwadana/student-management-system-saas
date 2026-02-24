'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { Student } from '@/types/student.types';
import { deleteStudent } from '@/lib/actions/students';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudentTableProps {
  students: Student[];
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'graduated', label: 'Graduated' },
];

export function StudentTable({ students }: StudentTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = await deleteStudent(id);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Failed to delete student',
      });
    }
    setDeletingId(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'suspended':
        return 'destructive';
      case 'graduated':
        return 'outline';
      default:
        return 'default';
    }
  };

  // Filter and search
  const filteredStudents = useMemo(() => {
    let result = students;

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.full_name.toLowerCase().includes(query) ||
          s.student_code.toLowerCase().includes(query) ||
          s.email?.toLowerCase().includes(query) ||
          s.phone?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [students, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Reset page when filters change
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
        placeholder="Search by name, code, email, or phone..."
        filterOptions={STATUS_OPTIONS}
        filterLabel="Status"
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
      />

      {paginatedStudents.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <span className="text-2xl">🎓</span>
          </div>
          <h3 className="text-lg font-medium">No students found</h3>
          <p className="text-muted-foreground mt-1">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Add your first student to get started.'}
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
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Classes</TableHead>
                  <TableHead className="font-semibold">Joining Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-sm font-medium">{student.student_code}</TableCell>
                    <TableCell>
                      <Link href={`/students/${student.id}`} className="font-medium hover:text-primary transition-colors">
                        {student.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(student.status)} className="capitalize">
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.enrollments?.map((enrollment, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {enrollment.class.class_name}
                          </Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(student.joining_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/students/${student.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/students/${student.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
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
                          title="Delete Student"
                          description={`Are you sure you want to delete "${student.full_name}"? This will also remove all their enrollments, attendance records, and payment history. This action cannot be undone.`}
                          actionLabel="Delete"
                          variant="destructive"
                          onConfirm={() => handleDelete(student.id)}
                          disabled={deletingId === student.id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length}</span>
              <Select value={String(pageSize)} onValueChange={(val) => { setPageSize(Number(val)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per page</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-3">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
