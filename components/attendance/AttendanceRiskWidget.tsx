"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AttendanceRiskWidget() {
    // Mock data for AI analysis
    const atRiskStudents = [
        { name: "Alex Johnson", risk: "High", reason: "Absent 3 days in a row", trend: -15 },
        { name: "Maria Garcia", risk: "Medium", reason: "Frequent lateness", trend: -5 },
    ];

    return (
        <Card className="border-l-4 border-l-rose-500 shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        AI Risk Analysis
                    </CardTitle>
                    <Badge variant="outline" className="animate-pulse bg-rose-50 text-rose-600 border-rose-200">
                        Live Insights
                    </Badge>
                </div>
                <CardDescription>
                    Students requiring attention based on recent patterns.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {atRiskStudents.map((student, i) => (
                        <div key={i} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                            <div>
                                <p className="font-medium text-sm">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.reason}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-rose-600 flex items-center">
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                    {student.trend}%
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                    {student.risk}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
