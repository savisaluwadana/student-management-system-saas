export type PaymentStatus = 'paid' | 'unpaid' | 'overdue' | 'partial';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online' | 'other';

export interface FeePayment {
  id: string;
  student_id: string;
  enrollment_id: string | null;
  amount: number;
  payment_month: string;
  payment_date: string | null;
  due_date: string;
  status: PaymentStatus;
  payment_method: PaymentMethod | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    full_name: string;
    student_code: string;
  };
}

export interface CreatePaymentInput {
  student_id: string;
  enrollment_id?: string;
  amount: number;
  payment_month: string;
  due_date: string;
  status?: PaymentStatus;
  payment_method?: PaymentMethod;
  transaction_id?: string;
  payment_date?: string;
  notes?: string;
}

export interface PaymentSummary {
  student_id: string;
  student_code: string;
  full_name: string;
  total_payments: number;
  total_paid: number;
  total_unpaid: number;
  total_overdue: number;
  total_partial: number;
}

export interface DashboardStats {
  totalStudents: number;
  activeClasses: number;
  totalRevenue: number;
  pendingPayments: number;
}
