import { getSessionById } from '@/lib/actions/sessions';
import { getClasses } from '@/lib/actions/classes';
import { SessionForm } from '@/components/sessions/SessionForm';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface SessionPageProps {
    params: {
        id: string;
    };
}

export default async function SessionPage({ params }: SessionPageProps) {
    const [session, classes] = await Promise.all([
        getSessionById(params.id),
        getClasses()
    ]);

    if (!session) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/sessions">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Clock className="h-8 w-8 text-primary" />
                        Edit Session
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Update session details and schedule
                    </p>
                </div>
            </div>

            <SessionForm session={session} classes={classes} />
        </div>
    );
}
