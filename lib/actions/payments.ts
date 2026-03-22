'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Class from '@/lib/mongodb/models/Class';
import mongoose from 'mongoose';
import type { FeePayment as FeePaymentType, CreatePaymentInput, DashboardStats } from '@/types/payment.types';

export async function recordPayment(input: CreatePaymentInput): Promise<{ success: boolean; error?: string }> {
  return createPayment(input);
}

export async function getPayments(status?: string) {
  await connectDB();

  const filter: any = {};
  if (status) filter.status = status;

  const payments = await FeePayment.find(filter)
    .sort({ created_at: -1 })
    .populate('student_id', 'id full_name student_code')
    .lean({ virtuals: true });

  return (payments as any[]).map((p) => ({
    ...p,
    id: p._id.toString(),
    students: {
      id: p.student_id?._id?.toString(),
      full_name: p.student_id?.full_name,
      student_code: p.student_id?.student_code,
    },
  }));
}

export async function createPayment(input: CreatePaymentInput): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  try {
    await FeePayment.create(input);
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePayment(id: string, input: Partial<CreatePaymentInput>): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) return { success: false, error: 'Invalid ID' };

  try {
    await FeePayment.findByIdAndUpdate(id, input);
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markPaymentAsPaid(
  paymentId: string,
  paymentMethod: string,
  transactionId?: string
): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  if (!mongoose.isValidObjectId(paymentId)) return { success: false, error: 'Invalid ID' };

  try {
    await FeePayment.findByIdAndUpdate(paymentId, {
      status: 'paid',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      payment_date: new Date().toISOString(),
    });
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB();
  const Student = (await import('@/lib/mongodb/models/Student')).default;

  const [totalStudents, activeClasses, paidPayments, pendingPayments] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Class.countDocuments({ status: 'active' }),
    FeePayment.find({ status: 'paid' }).select('amount').lean(),
    FeePayment.find({ status: { $in: ['unpaid', 'overdue'] } }).select('amount').lean(),
  ]);

  const totalRevenue = (paidPayments as any[]).reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = (pendingPayments as any[]).reduce((sum, p) => sum + (p.amount || 0), 0);

  return { totalStudents, activeClasses, totalRevenue, pendingPayments: pendingAmount };
}

/**
 * Generate monthly fees for all active enrollments (replaces Supabase RPC)
 */
export async function generateMonthlyFees(targetMonth: Date): Promise<{ success: boolean; error?: string; count?: number }> {
  await connectDB();

  const monthStr = targetMonth.toISOString().split('T')[0];
  const dueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 5).toISOString().split('T')[0];

  try {
    const enrollments = await Enrollment.find({ status: 'active' })
      .populate('class_id', 'fee_amount')
      .lean({ virtuals: true });

    let count = 0;
    for (const enrollment of enrollments as any[]) {
      if (!enrollment.class_id?.fee_amount) continue;
      const amount = enrollment.custom_fee || enrollment.class_id.fee_amount;

      const existing = await FeePayment.findOne({
        student_id: enrollment.student_id,
        class_id: enrollment.class_id._id,
        payment_month: monthStr,
      });

      if (!existing) {
        await FeePayment.create({
          student_id: enrollment.student_id,
          class_id: enrollment.class_id._id,
          amount,
          status: 'pending',
          payment_month: monthStr,
          due_date: dueDate,
        });
        count++;
      }
    }

    revalidatePath('/payments');
    return { success: true, count };
  } catch (error: any) {
    console.error('Error generating monthly fees:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark overdue payments (replaces Supabase RPC)
 */
export async function markOverduePayments(): Promise<{ success: boolean; error?: string; count?: number }> {
  await connectDB();
  const today = new Date().toISOString().split('T')[0];

  try {
    const result = await FeePayment.updateMany(
      { status: 'pending', due_date: { $lt: today } },
      { status: 'overdue' }
    );
    revalidatePath('/payments');
    return { success: true, count: result.modifiedCount };
  } catch (error: any) {
    console.error('Error marking overdue payments:', error);
    return { success: false, error: error.message };
  }
}
