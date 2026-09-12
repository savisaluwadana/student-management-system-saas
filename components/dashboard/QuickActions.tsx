'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CreditCard,
  FileText,
  GraduationCap,
  MessageSquare,
  ScanLine,
  UserPlus,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const quickActions = [
  { title: 'Add student', description: 'Create a new profile', href: '/students/new', icon: UserPlus },
  { title: 'Students', description: 'Search and manage', href: '/students', icon: Users },
  { title: 'Mark attendance', description: 'Record today’s class', href: '/attendance', icon: CalendarCheck },
  { title: 'Scan attendance', description: 'Use student barcode', href: '/attendance/scan', icon: ScanLine },
  { title: 'Record payment', description: 'Collect and receipt', href: '/payments', icon: CreditCard },
  { title: 'Create assessment', description: 'Grades and exams', href: '/assessments/new', icon: GraduationCap },
  { title: 'Send message', description: 'Reach students', href: '/communications', icon: MessageSquare },
  { title: 'Reports', description: 'Export performance', href: '/reports', icon: FileText },
];

export function QuickActions() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Quick actions</CardTitle>
          <span className="text-xs text-muted-foreground">Common workflows</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.025 }}
            >
              <Link
                href={action.href}
                className="group flex min-h-[104px] h-full flex-col justify-between rounded-xl border bg-muted/25 p-3 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-background hover:shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border bg-background">
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-semibold leading-tight">{action.title}</p>
                  <p className="mt-1 hidden text-[10px] leading-tight text-muted-foreground lg:block">{action.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
