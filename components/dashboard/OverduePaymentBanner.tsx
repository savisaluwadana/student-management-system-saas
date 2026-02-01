'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X, ChevronRight, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OverduePayment {
    student_id: string;
    student_name: string;
    amount: number;
    due_date: string;
    days_overdue: number;
}

interface OverduePaymentBannerProps {
    overduePayments: OverduePayment[];
    totalOverdueAmount: number;
}

export function OverduePaymentBanner({
    overduePayments,
    totalOverdueAmount
}: OverduePaymentBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    if (!isVisible || overduePayments.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <Card className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-red-500/20">
                    <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-red-600 dark:text-red-400">
                                            Overdue Payments Alert
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {overduePayments.length} student{overduePayments.length > 1 ? 's' : ''} with
                                            overdue payments totaling{' '}
                                            <span className="font-semibold text-foreground">
                                                ${totalOverdueAmount.toLocaleString()}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href="/payments?filter=overdue">
                                            <Button size="sm" variant="destructive" className="gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                View All
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsVisible(false)}
                                            className="h-8 w-8"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Expandable details */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="mt-2 text-xs h-6 px-2"
                                >
                                    {isExpanded ? 'Hide Details' : 'Show Details'}
                                </Button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 space-y-2"
                                        >
                                            {overduePayments.slice(0, 5).map((payment) => (
                                                <div
                                                    key={payment.student_id}
                                                    className="flex items-center justify-between p-2 bg-background/50 rounded-lg text-sm"
                                                >
                                                    <div>
                                                        <span className="font-medium">{payment.student_name}</span>
                                                        <span className="text-muted-foreground ml-2">
                                                            ({payment.days_overdue} days overdue)
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                                        ${payment.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                            {overduePayments.length > 5 && (
                                                <p className="text-xs text-muted-foreground text-center">
                                                    +{overduePayments.length - 5} more overdue payments
                                                </p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
