import { getPayments, getDashboardStats } from '@/lib/actions/payments';
import { PaymentsClient } from '@/components/payments/PaymentsClient';

export default async function PaymentsPage() {
  const [payments, stats] = await Promise.all([
    getPayments(),
    getDashboardStats(),
  ]);

  return (
    <PaymentsClient
      payments={payments}
      stats={{
        totalRevenue: stats.totalRevenue,
        pendingPayments: stats.pendingPayments,
      }}
    />
  );
}
