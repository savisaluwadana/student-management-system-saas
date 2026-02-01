import { getSessions } from '@/lib/actions/sessions';
import { getClasses } from '@/lib/actions/classes';
import { SessionList } from '@/components/sessions/SessionList';
import { Button } from '@/components/ui/button';
import { Plus, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function SessionsPage() {
    const [sessions, classes] = await Promise.all([
        getSessions(),
        getClasses()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Clock className="h-8 w-8 text-primary" />
                        Sessions
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage class sessions and time slots
                    </p>
                </div>
                <Link href="/sessions/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Session
                    </Button>
                </Link>
            </div>

            <SessionList sessions={sessions} />
        </div>
    );
}
