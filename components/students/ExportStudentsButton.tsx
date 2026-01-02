'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getAllStudentsForExport } from '@/lib/actions/students';
import { toCSV, downloadCSV } from '@/lib/utils';

export function ExportStudentsButton() {
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            const students = await getAllStudentsForExport();

            const csvContent = toCSV(students, {
                headers: [
                    'student_code',
                    'full_name',
                    'email',
                    'phone',
                    'guardian_name',
                    'guardian_phone',
                    'guardian_email',
                    'date_of_birth',
                    'address',
                    'status',
                    'joining_date',
                ],
                headerLabels: {
                    student_code: 'Student Code',
                    full_name: 'Full Name',
                    email: 'Email',
                    phone: 'Phone',
                    guardian_name: 'Guardian Name',
                    guardian_phone: 'Guardian Phone',
                    guardian_email: 'Guardian Email',
                    date_of_birth: 'Date of Birth',
                    address: 'Address',
                    status: 'Status',
                    joining_date: 'Joining Date',
                },
            });

            const filename = `students-export-${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(csvContent, filename);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
        </Button>
    );
}
