import { getTutorialProgressSummary } from '@/lib/actions/tutorials';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BarChart3, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function TutorialStatusPage() {
    const progressSummary = await getTutorialProgressSummary();

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
                        <BarChart3 className="h-8 w-8 text-primary" />
                        Tutorial Progress
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track student tutorial completion status
                    </p>
                </div>
            </div>

            {progressSummary.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <BarChart3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold">No Progress Data</h3>
                        <p className="text-muted-foreground text-center max-w-md mt-1">
                            Add tutorials and assign them to students to track progress.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {progressSummary.map((item) => (
                        <Card key={item.tutorial_id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                {item.class_name && (
                                    <p className="text-sm text-muted-foreground">{item.class_name}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Completion</span>
                                        <span className="font-semibold">{item.completion_percentage}%</span>
                                    </div>
                                    <Progress value={item.completion_percentage} className="h-2" />
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-2">
                                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{item.completed_count}</p>
                                        <p className="text-xs text-muted-foreground">Completed</p>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
                                        <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{item.in_progress_count}</p>
                                        <p className="text-xs text-muted-foreground">In Progress</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-500/10 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                                        <p className="text-lg font-bold">{item.not_started_count}</p>
                                        <p className="text-xs text-muted-foreground">Not Started</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
