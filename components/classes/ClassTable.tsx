"use client";

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteClass } from '@/lib/actions/classes';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Class } from '@/types/class.types';
import { ClassForm } from './ClassForm';

interface ClassTableProps {
    classes: Class[];
}

export function ClassTable({ classes }: ClassTableProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            return;
        }

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

    if (classes.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">No classes found</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {classes.map((cls) => (
                    <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.class_code}</TableCell>
                        <TableCell>{cls.class_name}</TableCell>
                        <TableCell>{cls.subject}</TableCell>
                        <TableCell>{formatCurrency(cls.monthly_fee)}</TableCell>
                        <TableCell>{cls.capacity}</TableCell>
                        <TableCell>
                            <Badge variant={cls.status === 'active' ? 'default' : 'secondary'}>
                                {cls.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                            <ClassForm
                                initialData={cls}
                                trigger={
                                    <Button variant="ghost" size="icon">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                }
                                onSuccess={() => router.refresh()}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(cls.id)}
                                disabled={deletingId === cls.id}
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
