'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface AttendanceTrendData {
    date: string;
    present: number;
    absent: number;
    late: number;
    total: number;
}

interface AttendanceTrendChartProps {
    data: AttendanceTrendData[];
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
    const { chartData, stats } = useMemo(() => {
        if (!data || data.length === 0) {
            return { chartData: [], stats: { avg: 0, trend: 'neutral' as const, change: 0 } };
        }

        // Calculate attendance rate for each day
        const chartData = data.map((day) => ({
            ...day,
            rate: day.total > 0 ? Math.round(((day.present + day.late) / day.total) * 100) : 0,
        }));

        // Calculate overall stats
        const totalPresent = data.reduce((sum, d) => sum + d.present + d.late, 0);
        const totalAll = data.reduce((sum, d) => sum + d.total, 0);
        const avg = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0;

        // Calculate trend (compare first half vs second half)
        const mid = Math.floor(data.length / 2);
        const firstHalf = data.slice(0, mid);
        const secondHalf = data.slice(mid);

        const firstHalfRate = firstHalf.length > 0
            ? firstHalf.reduce((sum, d) => sum + (d.total > 0 ? (d.present + d.late) / d.total : 0), 0) / firstHalf.length
            : 0;
        const secondHalfRate = secondHalf.length > 0
            ? secondHalf.reduce((sum, d) => sum + (d.total > 0 ? (d.present + d.late) / d.total : 0), 0) / secondHalf.length
            : 0;

        const change = Math.round((secondHalfRate - firstHalfRate) * 100);
        const trend = change > 2 ? 'up' : change < -2 ? 'down' : 'neutral';

        return { chartData, stats: { avg, trend, change: Math.abs(change) } };
    }, [data]);

    const maxRate = 100;
    const chartHeight = 120;

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        30-Day Attendance Trend
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
                    No attendance data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        30-Day Attendance Trend
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{stats.avg}%</span>
                        {stats.trend === 'up' ? (
                            <div className="flex items-center text-green-500 text-sm">
                                <TrendingUp className="h-4 w-4 mr-1" />
                                +{stats.change}%
                            </div>
                        ) : stats.trend === 'down' ? (
                            <div className="flex items-center text-red-500 text-sm">
                                <TrendingDown className="h-4 w-4 mr-1" />
                                -{stats.change}%
                            </div>
                        ) : null}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative w-full" style={{ height: chartHeight + 30 }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full w-8 flex flex-col justify-between text-xs text-muted-foreground pr-2">
                        <span>100%</span>
                        <span>50%</span>
                        <span>0%</span>
                    </div>

                    {/* Chart area */}
                    <div className="absolute left-10 right-0 top-0" style={{ height: chartHeight }}>
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="border-t border-dashed border-muted" />
                            ))}
                        </div>

                        {/* Bars */}
                        <div className="flex items-end h-full gap-[2px]">
                            {chartData.map((day, index) => {
                                const barHeight = (day.rate / maxRate) * chartHeight;
                                const isGood = day.rate >= 80;
                                const isMedium = day.rate >= 60 && day.rate < 80;

                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 group relative"
                                        style={{ height: '100%' }}
                                    >
                                        <div
                                            className={`absolute bottom-0 w-full rounded-t transition-all duration-200 hover:opacity-80 ${isGood ? 'bg-green-500' : isMedium ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ height: `${Math.max(barHeight, 2)}px` }}
                                        />

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-popover text-popover-foreground text-xs rounded-lg shadow-lg p-2 whitespace-nowrap border">
                                                <div className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                <div className="text-muted-foreground">Rate: {day.rate}%</div>
                                                <div className="text-green-500">Present: {day.present}</div>
                                                <div className="text-red-500">Absent: {day.absent}</div>
                                                <div className="text-yellow-500">Late: {day.late}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* X-axis labels */}
                    <div className="absolute left-10 right-0 bottom-0 flex justify-between text-xs text-muted-foreground">
                        {chartData.length > 0 && (
                            <>
                                <span>{new Date(chartData[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                <span>{new Date(chartData[chartData.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-green-500" />
                        <span className="text-muted-foreground">≥80%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500" />
                        <span className="text-muted-foreground">60-79%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-muted-foreground">&lt;60%</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
