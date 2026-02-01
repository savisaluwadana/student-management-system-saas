import { getClasses } from '@/lib/actions/classes';
import { SessionForm } from '@/components/sessions/SessionForm';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function NewSessionPage() {
    const classes = await getClasses();

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
                        Add New Session
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create a new class session or time slot
                    </p>
                </div>
            </div>

            <SessionForm classes={classes} />
        </div>
    );
}
