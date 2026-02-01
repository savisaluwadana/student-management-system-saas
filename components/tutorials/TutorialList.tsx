'use client';

import { TutorialWithRelations, deleteTutorial } from '@/lib/actions/tutorials';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Video,
    FileText,
    Link as LinkIcon,
    Edit,
    Trash2,
    MoreVertical,
    ExternalLink
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

interface TutorialListProps {
    tutorials: TutorialWithRelations[];
}

const contentTypeIcons: Record<string, typeof Video> = {
    video: Video,
    document: FileText,
    link: LinkIcon,
    other: FileText,
};

const contentTypeColors: Record<string, string> = {
    video: 'text-red-500 bg-red-500/10',
    document: 'text-blue-500 bg-blue-500/10',
    link: 'text-green-500 bg-green-500/10',
    other: 'text-gray-500 bg-gray-500/10',
};

export function TutorialList({ tutorials }: TutorialListProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        const result = await deleteTutorial(deleteId);
        setIsDeleting(false);
        setDeleteId(null);

        if (result.success) {
            router.refresh();
        }
    };

    if (tutorials.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <Video className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold">No Tutorials Yet</h3>
                    <p className="text-muted-foreground text-center max-w-md mt-1">
                        Create tutorials to share educational content with students.
                    </p>
                    <Link href="/tutorials/new" className="mt-4">
                        <Button>Add Your First Tutorial</Button>
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tutorials.map((tutorial, index) => {
                    const Icon = contentTypeIcons[tutorial.content_type || 'other'];
                    const colorClass = contentTypeColors[tutorial.content_type || 'other'];

                    return (
                        <motion.div
                            key={tutorial.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="group hover:shadow-lg transition-all duration-300 border-transparent hover:border-primary/20 h-full flex flex-col">
                                <CardContent className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-lg truncate">{tutorial.title}</h3>
                                                <Badge variant="outline" className="mt-1 capitalize">
                                                    {tutorial.content_type || 'Other'}
                                                </Badge>
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
                                                    <Link href={`/tutorials/${tutorial.id}`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                {tutorial.content_url && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={tutorial.content_url} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4 mr-2" />
                                                            Open Content
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => setDeleteId(tutorial.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {tutorial.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                                            {tutorial.description}
                                        </p>
                                    )}

                                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                                        {tutorial.classes && (
                                            <Badge variant="secondary">
                                                {tutorial.classes.class_name}
                                            </Badge>
                                        )}
                                        {tutorial.institutes && (
                                            <Badge variant="outline">
                                                {tutorial.institutes.name}
                                            </Badge>
                                        )}
                                        {tutorial.is_public && (
                                            <Badge variant="default" className="bg-green-500">
                                                Public
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tutorial</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this tutorial? This will also delete all student progress associated with it.
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
