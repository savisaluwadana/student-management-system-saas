'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    institutes: 'Institutes',
    students: 'Students',
    teachers: 'Teachers',
    classes: 'Classes',
    sessions: 'Sessions',
    attendance: 'Attendance',
    tutorials: 'Tutorials',
    assessments: 'Assessments',
    payments: 'Payments',
    communications: 'Communications',
    reports: 'Reports',
    settings: 'Settings',
    new: 'New',
    edit: 'Edit',
    grades: 'Grades',
    import: 'Import',
    barcodes: 'Barcodes',
    bulk: 'Bulk',
    mark: 'Mark',
    scan: 'Scan',
    status: 'Status',
    debug: 'Debug',
};

function getLabel(segment: string): string {
    // Check known labels
    if (routeLabels[segment]) return routeLabels[segment];
    // If it looks like a UUID, show a short version
    if (/^[0-9a-f]{8}-/.test(segment)) return `#${segment.substring(0, 8)}`;
    // Capitalize first letter
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
            </Link>
            {segments.map((segment, index) => {
                const path = '/' + segments.slice(0, index + 1).join('/');
                const isLast = index === segments.length - 1;
                const label = getLabel(segment);

                return (
                    <span key={path} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{label}</span>
                        ) : (
                            <Link href={path} className="hover:text-foreground transition-colors">
                                {label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
