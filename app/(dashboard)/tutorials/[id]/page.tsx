import { getTutorialById } from '@/lib/actions/tutorials';
import { getClasses } from '@/lib/actions/classes';
import { getInstitutes } from '@/lib/actions/institutes';
import { TutorialForm } from '@/components/tutorials/TutorialForm';
import { notFound } from 'next/navigation';
import { ArrowLeft, Video } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TutorialPageProps {
    params: {
        id: string;
    };
}

export default async function TutorialPage({ params }: TutorialPageProps) {
    const [tutorial, classes, institutes] = await Promise.all([
        getTutorialById(params.id),
        getClasses(),
        getInstitutes()
    ]);

    if (!tutorial) {
        notFound();
    }

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
                        Edit Tutorial
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Update tutorial content and details
                    </p>
                </div>
            </div>

            <TutorialForm
                tutorial={tutorial}
                classes={classes}
                institutes={institutes}
            />
        </div>
    );
}
