'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { parseCSV, validateStudentRow, STUDENT_CSV_HEADERS, downloadCSV } from '@/lib/utils';
import { bulkCreateStudents } from '@/lib/actions/students';
import { ArrowLeft, Download, Upload, Check, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ParsedStudent {
    student_code: string;
    full_name: string;
    email: string;
    phone: string;
    guardian_name: string;
    guardian_phone: string;
    guardian_email: string;
    date_of_birth: string;
    address: string;
    status: string;
    _valid: boolean;
    _errors: string[];
}

export default function ImportStudentsPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
    const [parseErrors, setParseErrors] = useState<{ row: number; message: string }[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        imported: number;
        failed: number;
        errors: string[];
    } | null>(null);

    const handleFileSelect = useCallback(async (selectedFile: File) => {
        setFile(selectedFile);
        setParsedData([]);
        setParseErrors([]);
        setImportResult(null);

        const text = await selectedFile.text();
        const result = parseCSV(text, {
            transform: (row) => {
                const validation = validateStudentRow(row);
                return {
                    ...row,
                    _valid: validation.valid,
                    _errors: validation.errors,
                } as ParsedStudent;
            },
        });

        setParsedData(result.data);
        setParseErrors(result.errors);
    }, []);

    const handleClear = () => {
        setFile(null);
        setParsedData([]);
        setParseErrors([]);
        setImportResult(null);
    };

    const handleImport = async () => {
        const validStudents = parsedData.filter((s) => s._valid);
        if (validStudents.length === 0) {
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            // Prepare data for import (remove validation fields)
            const studentsToImport = validStudents.map(({ _valid, _errors, ...student }) => ({
                student_code: student.student_code,
                full_name: student.full_name,
                email: student.email || undefined,
                phone: student.phone || undefined,
                guardian_name: student.guardian_name || undefined,
                guardian_phone: student.guardian_phone || undefined,
                guardian_email: student.guardian_email || undefined,
                date_of_birth: student.date_of_birth || undefined,
                address: student.address || undefined,
                status: (student.status?.toLowerCase() as any) || 'active',
            }));

            const result = await bulkCreateStudents(studentsToImport);

            setImportResult({
                success: result.success,
                imported: result.imported || 0,
                failed: result.failed || 0,
                errors: result.errors || [],
            });

            if (result.success && result.imported > 0) {
                // Wait a moment then redirect
                setTimeout(() => {
                    router.push('/students');
                    router.refresh();
                }, 2000);
            }
        } catch (error: any) {
            setImportResult({
                success: false,
                imported: 0,
                failed: validStudents.length,
                errors: [error.message],
            });
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        const template = STUDENT_CSV_HEADERS.join(',') + '\nSTU001,John Doe,john@example.com,+1234567890,Jane Doe,+0987654321,jane@example.com,2010-01-15,123 Main St,active';
        downloadCSV(template, 'student-import-template.csv');
    };

    const validCount = parsedData.filter((s) => s._valid).length;
    const invalidCount = parsedData.filter((s) => !s._valid).length;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/students">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Import Students</h1>
                    <p className="text-muted-foreground">Upload a CSV file to bulk import students</p>
                </div>
            </div>

            {/* Template Download */}
            <Card>
                <CardHeader>
                    <CardTitle>Step 1: Download Template</CardTitle>
                    <CardDescription>
                        Start with our CSV template to ensure proper formatting
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Template
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                        Required columns: <code>student_code</code>, <code>full_name</code>
                    </p>
                </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Upload CSV File</CardTitle>
                    <CardDescription>
                        Upload your completed CSV file
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FileUpload
                        accept=".csv"
                        onFileSelect={handleFileSelect}
                        onClear={handleClear}
                        selectedFile={file}
                    />
                </CardContent>
            </Card>

            {/* Parse Errors */}
            {parseErrors.length > 0 && (
                <Card className="border-red-200 dark:border-red-900">
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Parse Errors
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc list-inside space-y-1">
                            {parseErrors.map((error, i) => (
                                <li key={i} className="text-sm text-red-600">
                                    Row {error.row}: {error.message}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Preview */}
            {parsedData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Step 3: Review Data</CardTitle>
                        <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Check className="h-4 w-4 text-green-600" />
                                Valid: {validCount}
                            </span>
                            <span className="flex items-center gap-1">
                                <X className="h-4 w-4 text-red-600" />
                                Invalid: {invalidCount}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Guardian</TableHead>
                                        <TableHead>Errors</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedData.slice(0, 50).map((student, i) => (
                                        <TableRow key={i} className={!student._valid ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                                            <TableCell>
                                                {student._valid ? (
                                                    <Badge variant="default">Valid</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Invalid</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-mono">{student.student_code}</TableCell>
                                            <TableCell>{student.full_name}</TableCell>
                                            <TableCell>{student.email || '-'}</TableCell>
                                            <TableCell>{student.phone || '-'}</TableCell>
                                            <TableCell>{student.guardian_name || '-'}</TableCell>
                                            <TableCell className="text-red-600 text-sm">
                                                {student._errors.join(', ')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {parsedData.length > 50 && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Showing first 50 of {parsedData.length} rows
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Import Result */}
            {importResult && (
                <Card className={importResult.success ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}>
                    <CardContent className="pt-6">
                        {importResult.success ? (
                            <div className="text-center">
                                <Check className="h-12 w-12 text-green-600 mx-auto mb-2" />
                                <p className="text-lg font-semibold">Import Successful!</p>
                                <p className="text-muted-foreground">
                                    Imported {importResult.imported} students. Redirecting...
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-red-600 font-semibold mb-2">Import Failed</p>
                                <p>Imported: {importResult.imported}, Failed: {importResult.failed}</p>
                                {importResult.errors.length > 0 && (
                                    <ul className="list-disc list-inside mt-2 text-sm text-red-600">
                                        {importResult.errors.slice(0, 10).map((error, i) => (
                                            <li key={i}>{error}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Import Button */}
            {parsedData.length > 0 && validCount > 0 && !importResult?.success && (
                <div className="flex justify-end">
                    <Button
                        size="lg"
                        onClick={handleImport}
                        disabled={importing || validCount === 0}
                    >
                        {importing ? (
                            'Importing...'
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import {validCount} Students
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
