import { getPayments, getDashboardStats } from '@/lib/actions/payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

export default async function PaymentsPage() {
  const payments = await getPayments();
  const stats = await getDashboardStats();

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default'; // default in shadcn is usually black/primary
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Payments
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Manage tuition fees and financial records
          </p>
        </div>
        <PaymentForm />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {formatCurrency(stats.pendingPayments)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg ring-1 ring-black/5 dark:ring-white/10">
        <CardHeader>
          <CardTitle className="text-xl">Recent Transactions</CardTitle>
          <CardDescription>
            A list of all recent fee payments and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-medium">No payments found</h3>
              <p className="text-muted-foreground mt-1">
                Record a payment to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-md border bg-white dark:bg-zinc-950">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Method</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((payment) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
