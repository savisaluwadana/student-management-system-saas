import { getTutorials, getTutorialStats } from '@/lib/actions/tutorials';
import { getClasses } from '@/lib/actions/classes';
import { TutorialList } from '@/components/tutorials/TutorialList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Video, BookOpen, FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function TutorialsPage() {
    const [tutorials, classes, stats] = await Promise.all([
        getTutorials(),
        getClasses(),
        getTutorialStats()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Video className="h-8 w-8 text-primary" />
                        Tutorials
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage educational content and tutorials
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/tutorials/status">
                        <Button variant="outline" className="gap-2">
                            <BarChart3 className="h-4 w-4" />
                            View Progress
                        </Button>
                    </Link>
                    <Link href="/tutorials/new">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Tutorial
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <Video className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">Total Tutorials</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{classes.length}</p>
                            <p className="text-sm text-muted-foreground">Classes</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{tutorials.filter(t => t.content_type === 'video').length}</p>
                            <p className="text-sm text-muted-foreground">Video Tutorials</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <TutorialList tutorials={tutorials} />
        </div>
    );
}
