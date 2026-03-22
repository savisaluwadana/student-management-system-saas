'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deleteAssessment } from '@/lib/actions/assessments';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';

interface AssessmentActionsProps {
    id: string;
}

export function AssessmentActions({ id }: AssessmentActionsProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteAssessment(id);
            if (result.success) {
                toast({
                    title: "Success",
                    description: "Assessment deleted successfully",
                });
                router.refresh();
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: result.error || "Failed to delete assessment",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred",
            });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex justify-end gap-2">
            <Link href={`/assessments/${id}/grades`}>
                <Button size="sm" variant="default">
                    Enter Grades
                </Button>
            </Link>
            <Link href={`/assessments/${id}/edit`}>
                <Button size="sm" variant="ghost">
                    <Edit className="h-4 w-4" />
                </Button>
            </Link>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-zinc-800 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the assessment
                            and any associated grades.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-zinc-800 hover:bg-zinc-800">
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
