'use client';

import Link from 'next/link';
import { Check, Circle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type OnboardingChecklistProps = {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  attendanceRate: number;
  totalRevenue: number;
};

export function OnboardingChecklist({
  totalStudents,
  totalTeachers,
  activeClasses,
  attendanceRate,
  totalRevenue,
}: OnboardingChecklistProps) {
  const steps = [
    { label: 'Create your first class', href: '/classes/new', complete: activeClasses > 0 },
    { label: 'Add students', href: '/students/new', complete: totalStudents > 0 },
    { label: 'Invite a teacher', href: '/teachers/new', complete: totalTeachers > 0 },
    { label: 'Record attendance', href: '/attendance', complete: attendanceRate > 0 },
    { label: 'Record a payment', href: '/payments', complete: totalRevenue > 0 },
  ];

  const completed = steps.filter((step) => step.complete).length;
  const progress = Math.round((completed / steps.length) * 100);
  const nextStep = steps.find((step) => !step.complete);

  if (completed === steps.length) {
    return (
      <Card className="overflow-hidden border-border/70 bg-foreground text-background shadow-sm">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Workspace is fully configured</p>
            <p className="mt-1 text-sm text-background/65">
              Your core Academix workflow is active. You can now focus on attendance, collections and academic performance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Finish workspace setup</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">{completed} of {steps.length} essentials complete</p>
          </div>
          <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-3 h-1.5" />
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors',
              step.complete ? 'text-muted-foreground' : 'hover:bg-muted/70'
            )}
          >
            <span className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border',
              step.complete && 'border-foreground bg-foreground text-background'
            )}>
              {step.complete ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5 fill-current opacity-20" />}
            </span>
            <span className={cn(step.complete && 'line-through decoration-muted-foreground/40')}>{step.label}</span>
          </Link>
        ))}
        {nextStep && (
          <Button asChild className="mt-3 w-full">
            <Link href={nextStep.href}>Continue setup</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
