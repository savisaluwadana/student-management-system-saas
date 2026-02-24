'use client';

import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { SearchFilter } from '@/components/ui/SearchFilter';
import { Edit, ChevronLeft, ChevronRight, DollarSign, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PaymentsClientProps {
    payments: any[];
    stats: {
        totalRevenue: number;
        pendingPayments: number;
    };
}

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'paid':
            return 'default';
        case 'unpaid':
            return 'secondary';
        case 'overdue':
            return 'destructive';
        case 'partial':
            return 'outline';
        default:
            return 'default';
    }
};

export function PaymentsClient({ payments, stats }: PaymentsClientProps) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 15;

    const filteredPayments = useMemo(() => {
        let result = payments;
        if (statusFilter !== 'all') {
            result = result.filter((p) => p.status === statusFilter);
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.students?.full_name?.toLowerCase().includes(query) ||
                    p.students?.student_code?.toLowerCase().includes(query)
            );
        }
        return result;
    }, [payments, statusFilter, searchQuery]);

    const totalPages = Math.ceil(filteredPayments.length / pageSize);
    const paginatedPayments = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredPayments.slice(start, start + pageSize);
    }, [filteredPayments, currentPage, pageSize]);

    const handleSearchChange = useCallback((search: string) => {
        setSearchQuery(search);
        setCurrentPage(1);
    }, []);

    // Count by status
    const paidCount = payments.filter((p) => p.status === 'paid').length;
    const unpaidCount = payments.filter((p) => p.status === 'unpaid').length;
    const overdueCount = payments.filter((p) => p.status === 'overdue').length;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Payments</h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage tuition fees and financial records</p>
                </div>
                <PaymentForm />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-500" /> Total Revenue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-500" /> Pending
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.pendingPayments)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" /> Paid
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{paidCount}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" /> Overdue
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-foreground">{overdueCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl">Transactions</CardTitle>
                            <CardDescription>All fee payments and transactions</CardDescription>
                        </div>
                        <Tabs defaultValue="all" onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                            <TabsList>
                                <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
                                <TabsTrigger value="paid">Paid ({paidCount})</TabsTrigger>
                                <TabsTrigger value="unpaid">Unpaid ({unpaidCount})</TabsTrigger>
                                <TabsTrigger value="overdue">Overdue ({overdueCount})</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent>
                    <SearchFilter
                        placeholder="Search by student name or code..."
                        onSearchChange={handleSearchChange}
                    />

                    {paginatedPayments.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                <span className="text-2xl">💰</span>
                            </div>
                            <h3 className="text-lg font-medium">No payments found</h3>
                            <p className="text-muted-foreground mt-1">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your search or filter.'
                                    : 'Record a payment to get started.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded-md border bg-white dark:bg-zinc-950">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent bg-muted/50">
                                            <TableHead className="w-[100px] font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold">Student</TableHead>
                                            <TableHead className="font-semibold">Amount</TableHead>
                                            <TableHead className="font-semibold">Month</TableHead>
                                            <TableHead className="font-semibold">Date</TableHead>
                                            <TableHead className="text-right font-semibold">Method</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedPayments.map((payment) => (
                                            <TableRow key={payment.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(payment.status) as any} className="capitalize shadow-sm">
                                                        {payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{payment.students?.full_name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground">{payment.students?.student_code || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell>{formatDate(payment.payment_month, 'MMM yyyy')}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                                                </TableCell>
                                                <TableCell className="text-right capitalize text-muted-foreground">
                                                    {payment.payment_method?.replace('_', ' ') || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <PaymentForm
                                                        payment={payment}
                                                        trigger={
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        }
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-2 mt-4">
                                    <span className="text-sm text-muted-foreground">
                                        Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm font-medium px-3">Page {currentPage} of {totalPages}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= totalPages}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
