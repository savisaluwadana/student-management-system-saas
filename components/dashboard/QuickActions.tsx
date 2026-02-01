'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Users,
    GraduationCap,
    BookOpen,
    CalendarCheck,
    Barcode,
    Building2,
    Clock,
    PlayCircle,
    CreditCard,
    MessageSquare,
    ScanLine,
    UserPlus,
    Settings,
    FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const quickActions = [
    {
        title: 'Students',
        description: 'Manage student records',
        href: '/students',
        icon: Users,
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
        title: 'Add Student',
        description: 'Enroll new student',
        href: '/students/new',
        icon: UserPlus,
        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
        title: 'Classes',
        description: 'View all classes',
        href: '/classes',
        icon: GraduationCap,
        color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
        title: 'Attendance',
        description: 'Mark attendance',
        href: '/attendance',
        icon: CalendarCheck,
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    },
    {
        title: 'Scan Attendance',
        description: 'Barcode scanner',
        href: '/attendance/scan',
        icon: ScanLine,
        color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
        title: 'Bulk Attendance',
        description: 'Mark for class',
        href: '/attendance/bulk',
        icon: FileText,
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
        title: 'Student Barcodes',
        description: 'Generate & print',
        href: '/students/barcodes',
        icon: Barcode,
        color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
        title: 'Institutes',
        description: 'Manage branches',
        href: '/institutes',
        icon: Building2,
        color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
        title: 'Sessions',
        description: 'Class time slots',
        href: '/sessions',
        icon: Clock,
        color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    {
        title: 'Tutorials',
        description: 'Video content',
        href: '/tutorials',
        icon: PlayCircle,
        color: 'bg-red-500/10 text-red-600 dark:text-red-400',
    },
    {
        title: 'Payments',
        description: 'Fee management',
        href: '/payments',
        icon: CreditCard,
        color: 'bg-green-500/10 text-green-600 dark:text-green-400',
    },
    {
        title: 'Communications',
        description: 'Send messages',
        href: '/communications',
        icon: MessageSquare,
        color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 },
};

export function QuickActions() {
    return (
        <Card className="border-none shadow-xl bg-white/40 dark:bg-black/40 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10 rounded-2xl">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="text-2xl">⚡</span>
                    Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <motion.div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {quickActions.map((action) => (
                        <motion.div key={action.href} variants={item}>
                            <Link
                                href={action.href}
                                className="group flex flex-col items-center p-3 rounded-xl bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-md hover:scale-105"
                            >
                                <div className={`p-2.5 rounded-xl ${action.color} mb-2 group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <span className="text-xs font-medium text-center leading-tight">
                                    {action.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground text-center mt-0.5 hidden sm:block">
                                    {action.description}
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </CardContent>
        </Card>
    );
}
