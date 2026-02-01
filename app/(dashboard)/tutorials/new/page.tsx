import { getClasses } from '@/lib/actions/classes';
import { getInstitutes } from '@/lib/actions/institutes';
import { TutorialForm } from '@/components/tutorials/TutorialForm';
import { ArrowLeft, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewTutorialPage() {
    const [classes, institutes] = await Promise.all([
        getClasses(),
        getInstitutes()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/tutorials">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Video className="h-8 w-8 text-primary" />
                        Add New Tutorial
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create educational content for students
                    </p>
                </div>
            </div>

            <TutorialForm classes={classes} institutes={institutes} />
        </div>
    );
}
