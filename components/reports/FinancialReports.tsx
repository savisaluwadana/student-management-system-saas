'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { FinancialReport } from '@/lib/actions/reports';

interface FinancialReportsProps {
  data: FinancialReport;
}

export function FinancialReportsContent({ data }: FinancialReportsProps) {
  const { monthlyRevenue, paymentStats, defaulters, revenueByClass } = data;

  // Calculate trends
  const lastMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
  const revenueTrend = prevMonth 
    ? ((lastMonth?.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  LKR {paymentStats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                <p className="text-2xl font-bold mt-1">
                  LKR {paymentStats.paidAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-green-600 font-medium">
                {((paymentStats.paidAmount / paymentStats.totalRevenue) * 100).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">of total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold mt-1">
                  LKR {paymentStats.pendingAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold mt-1 text-red-600">
                  LKR {paymentStats.overdueAmount.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue collection over the past months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyRevenue.slice(-6).map((month) => {
              const monthName = new Date(month.month + '-01').toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              });
              const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));
              const widthPercent = (month.revenue / maxRevenue) * 100;

              return (
                <div key={month.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{monthName}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{month.payments} payments</span>
                      <span className="font-bold">LKR {month.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Defaulters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Payment Defaulters
            </CardTitle>
            <CardDescription>Students with overdue payments</CardDescription>
          </CardHeader>
          <CardContent>
            {defaulters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No overdue payments</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.slice(0, 10).map((defaulter) => (
                    <TableRow key={defaulter.student_id}>
                      <TableCell className="font-medium">{defaulter.student_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{defaulter.student_code}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        LKR {defaulter.total_pending.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{defaulter.overdue_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Class */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Revenue by Class
            </CardTitle>
            <CardDescription>Top revenue-generating classes</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueByClass.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No revenue data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByClass.slice(0, 10).map((classRev) => (
                    <TableRow key={classRev.class_name}>
                      <TableCell className="font-medium">{classRev.class_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{classRev.students}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        LKR {classRev.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
