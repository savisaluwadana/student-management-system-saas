import { getClassesForAttendance } from '@/lib/actions/attendance';
import { getInstitutes } from '@/lib/actions/institutes';
import { ScanAttendance } from '@/components/attendance/ScanAttendance';
import { ArrowLeft, ScanBarcode } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ScanAttendancePage() {
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
                        <ScanBarcode className="h-8 w-8 text-primary" />
                        Scan Attendance
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Scan student barcodes to mark attendance
                    </p>
                </div>
            </div>

            <ScanAttendance classes={classes} institutes={institutes} />
        </div>
    );
}
