import { getClassesForAttendance } from '@/lib/actions/attendance';
import { getInstitutes } from '@/lib/actions/institutes';
import { BulkAttendanceForm } from '@/components/attendance/BulkAttendanceForm';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BulkAttendancePage() {
    const [classes, institutes] = await Promise.all([
        getClassesForAttendance(),
        getInstitutes()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/attendance">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        Bulk Attendance
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Mark attendance for multiple students at once
                    </p>
                </div>
            </div>

            <BulkAttendanceForm classes={classes} institutes={institutes} />
        </div>
    );
}
