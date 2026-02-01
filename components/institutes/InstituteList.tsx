'use client';

import { InstituteSummary, deleteInstitute } from '@/lib/actions/institutes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Users,
    BookOpen,
    Mail,
    Phone,
    Edit,
    Trash2,
    MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface InstituteListProps {
    institutes: InstituteSummary[];
}

export function InstituteList({ institutes }: InstituteListProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        const result = await deleteInstitute(deleteId);
        setIsDeleting(false);
        setDeleteId(null);

        if (result.success) {
            router.refresh();
        }
    };

    if (institutes.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Building2 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold">No Institutes Yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-1">
                        Create your first institute to organize students and classes by location or branch.
                    </p>
                    <Link href="/institutes/new" className="mt-4">
                        <Button>Add Your First Institute</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {institutes.map((institute, index) => (
                    <motion.div
                        key={institute.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="group hover:shadow-lg transition-all duration-300 border-transparent hover:border-primary/20">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{institute.name}</h3>
                                            <p className="text-sm text-muted-foreground font-mono">{institute.code}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/institutes/${institute.id}`}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => setDeleteId(institute.id)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-3">
                                    {institute.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            <span className="truncate">{institute.email}</span>
                                        </div>
                                    )}
                                    {institute.phone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-4 w-4" />
                                            <span>{institute.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">{institute.total_students}</span>
                                        <span className="text-sm text-muted-foreground">Students</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-green-500" />
                                        <span className="text-sm font-medium">{institute.total_classes}</span>
                                        <span className="text-sm text-muted-foreground">Classes</span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <Badge variant={institute.status === 'active' ? 'default' : 'secondary'}>
                                        {institute.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Institute</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this institute? This action cannot be undone.
                            Students and classes associated with this institute will not be deleted but will be unlinked.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
