'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { FeePayment, CreatePaymentInput, DashboardStats } from '@/types/payment.types';

/**
 * Get all payments with optional filtering
 */
export async function getPayments(status?: string): Promise<FeePayment[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('fee_payments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new payment
 */
export async function createPayment(input: CreatePaymentInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('fee_payments')
    .insert(input);
  
  if (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/payments');
  return { success: true };
}

/**
 * Mark a payment as paid
 */
export async function markPaymentAsPaid(
  paymentId: string,
  paymentMethod: string,
  transactionId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('fee_payments')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      payment_date: new Date().toISOString(),
    })
    .eq('id', paymentId);
  
  if (error) {
    console.error('Error marking payment as paid:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/payments');
  return { success: true };
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  
  // Get total students
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  // Get active classes
  const { count: activeClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  
  // Get total revenue (sum of paid payments)
  const { data: paidPayments } = await supabase
    .from('fee_payments')
    .select('amount')
    .eq('status', 'paid');
  
  const totalRevenue = paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  
  // Get pending payments amount
  const { data: pendingPayments } = await supabase
    .from('fee_payments')
    .select('amount')
    .in('status', ['unpaid', 'overdue']);
  
  const pendingAmount = pendingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  
  return {
    totalStudents: totalStudents || 0,
    activeClasses: activeClasses || 0,
    totalRevenue,
    pendingPayments: pendingAmount,
  };
}

/**
 * Generate monthly fees for all active enrollments
 * This uses the Supabase function created in the schema
 */
export async function generateMonthlyFees(targetMonth: Date): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service role key not configured' };
  }
  
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data, error } = await supabase.rpc('generate_monthly_fees', {
    target_month: targetMonth.toISOString().split('T')[0]
  });
  
  if (error) {
    console.error('Error generating monthly fees:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/payments');
  return { success: true, count: data };
}

/**
 * Mark overdue payments
 * This uses the Supabase function created in the schema
 */
export async function markOverduePayments(): Promise<{ success: boolean; error?: string; count?: number }> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: 'Service role key not configured' };
  }
  
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data, error } = await supabase.rpc('mark_overdue_payments');
  
  if (error) {
    console.error('Error marking overdue payments:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/payments');
  return { success: true, count: data };
}
