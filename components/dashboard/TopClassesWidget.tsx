'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface TopClass {
    id: string;
    class_name: string;
    class_code: string;
    enrollment_count: number;
    attendance_rate: number;
}

interface TopClassesWidgetProps {
    classes: TopClass[];
}

const trophyColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

export function TopClassesWidget({ classes }: TopClassesWidgetProps) {
    if (classes.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Top Classes
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                    No class data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Top Classes by Enrollment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {classes.map((cls, index) => (
                    <Link
                        key={cls.id}
                        href={`/classes/${cls.id}`}
                        className="block group"
                    >
                        <div className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-muted/50">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-muted ${index < 3 ? trophyColors[index] : 'text-muted-foreground'}`}>
                                {index < 3 ? (
                                    <Trophy className="h-4 w-4" />
                                ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-medium truncate group-hover:text-primary transition-colors">
                                        {cls.class_name}
                                    </span>
                                    <Badge variant="outline" className="shrink-0">
                                        {cls.class_code}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span>{cls.enrollment_count} students</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>{cls.attendance_rate}% attendance</span>
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <Progress value={cls.attendance_rate} className="h-1.5" />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    );
}
