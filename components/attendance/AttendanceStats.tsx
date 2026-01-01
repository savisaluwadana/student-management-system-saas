import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';

interface AttendanceStatsProps {
    totalMarkedToday: number;
    presentToday: number;
    absentToday: number;
    overallAttendanceRate: number;
}

export function AttendanceStats({
    totalMarkedToday,
    presentToday,
    absentToday,
    overallAttendanceRate,
}: AttendanceStatsProps) {
    const stats = [
        {
            name: 'Marked Today',
            value: totalMarkedToday,
            icon: Users,
            description: 'Students marked today',
        },
        {
            name: 'Present Today',
            value: presentToday,
            icon: UserCheck,
            description: 'Students present',
        },
        {
            name: 'Absent Today',
            value: absentToday,
            icon: UserX,
            description: 'Students absent',
        },
        {
            name: 'Attendance Rate',
            value: `${overallAttendanceRate}%`,
            icon: TrendingUp,
            description: 'Last 30 days',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
                <Card key={stat.name}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
