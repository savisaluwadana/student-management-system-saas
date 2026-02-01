import { getStudents } from '@/lib/actions/students';
import { BarcodeManager } from '@/components/students/BarcodeManager';
import { ArrowLeft, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function BarcodesPage() {
    const students = await getStudents();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/students">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <QrCode className="h-8 w-8 text-primary" />
                        Student Barcodes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Generate and manage student barcodes for attendance scanning
                    </p>
                </div>
            </div>

            <BarcodeManager students={students} />
        </div>
    );
}
