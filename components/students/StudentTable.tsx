'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Student } from '@/types/student.types';
import { deleteStudent } from '@/lib/actions/students';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface StudentTableProps {
  students: Student[];
}

export function StudentTable({ students }: StudentTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

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

  if (students.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No students found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Classes</TableHead>
          <TableHead>Joining Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">{student.student_code}</TableCell>
            <TableCell>{student.full_name}</TableCell>
            <TableCell>{student.phone || '-'}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(student.status)}>
                {student.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {student.enrollments?.map((enrollment, index) => (
                  <Badge key={index} variant="secondary">
                    {enrollment.class.class_name}
                  </Badge>
                )) || '-'}
              </div>
            </TableCell>
            <TableCell>{formatDate(student.joining_date)}</TableCell>
            <TableCell className="text-right space-x-2">
              <Link href={`/students/${student.id}`}>
                <Button variant="ghost" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/students/${student.id}`}>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(student.id)}
                disabled={deletingId === student.id}
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
