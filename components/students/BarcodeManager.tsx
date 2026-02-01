'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { generateStudentBarcode, generateBulkBarcodes } from '@/lib/actions/barcode';
import { StudentBarcode } from './StudentBarcode';
import { SmartCard } from './SmartCard';
import {
    QrCode,
    Loader2,
    CheckCircle2,
    Search,
    Zap,
    CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Student {
    id: string;
    student_code: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    barcode?: string | null;
    status: string;
    school?: string | null;
}

interface BarcodeManagerProps {
    students: Student[];
}

export function BarcodeManager({ students }: BarcodeManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showCardModal, setShowCardModal] = useState(false);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [bulkResult, setBulkResult] = useState<{ count: number } | null>(null);
    const router = useRouter();

    const filteredStudents = students.filter(
        (s) =>
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.student_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.barcode && s.barcode.includes(searchQuery))
    );

    const studentsWithBarcode = students.filter((s) => s.barcode);
    const studentsWithoutBarcode = students.filter((s) => !s.barcode);

    const handleGenerateBarcode = async (studentId: string) => {
        setGeneratingId(studentId);
        const result = await generateStudentBarcode(studentId);
        setGeneratingId(null);

        if (result.success) {
            router.refresh();
        }
    };

    const handleGenerateBulk = () => {
        startTransition(async () => {
            const result = await generateBulkBarcodes();
            if (result.success) {
                setBulkResult({ count: result.count || 0 });
                router.refresh();
                setTimeout(() => setBulkResult(null), 3000);
            }
        });
    };

    const handleViewCard = (student: Student) => {
        setSelectedStudent(student);
        setShowCardModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{studentsWithBarcode.length}</p>
                            <p className="text-sm text-muted-foreground">With Barcode</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                            <QrCode className="h-6 w-6 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{studentsWithoutBarcode.length}</p>
                            <p className="text-sm text-muted-foreground">Without Barcode</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <Button
                            onClick={handleGenerateBulk}
                            disabled={isPending || studentsWithoutBarcode.length === 0}
                            className="w-full gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : bulkResult ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Generated {bulkResult.count}!
                                </>
                            ) : (
                                <>
                                    <Zap className="h-4 w-4" />
                                    Generate All Missing
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Student Barcodes</CardTitle>
                            <CardDescription>Generate and manage barcodes for attendance scanning</CardDescription>
                        </div>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {filteredStudents.map((student, index) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b"
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                                                    {student.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{student.full_name}</p>
                                                    <p className="text-xs text-muted-foreground">{student.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="text-sm bg-muted px-2 py-1 rounded">
                                                {student.student_code}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {student.barcode ? (
                                                <code className="text-sm bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-1 rounded font-mono">
                                                    {student.barcode}
                                                </code>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Not generated</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                                                {student.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {student.barcode ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewCard(student)}
                                                    >
                                                        <CreditCard className="h-4 w-4 mr-1" />
                                                        View Card
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleGenerateBarcode(student.id)}
                                                        disabled={generatingId === student.id}
                                                    >
                                                        {generatingId === student.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <QrCode className="h-4 w-4 mr-1" />
                                                                Generate
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Smart Card Modal */}
            <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Student ID Card</DialogTitle>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="space-y-4">
                            <SmartCard student={selectedStudent} />
                            <StudentBarcode
                                barcode={selectedStudent.barcode || ''}
                                studentName={selectedStudent.full_name}
                                studentCode={selectedStudent.student_code}
                                size="large"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
