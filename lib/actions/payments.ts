'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import Enrollment from '@/lib/mongodb/models/Enrollment';
import Class from '@/lib/mongodb/models/Class';
import Student from '@/lib/mongodb/models/Student';
import mongoose from 'mongoose';
import type { FeePayment as FeePaymentType, CreatePaymentInput, DashboardStats } from '@/types/payment.types';

function normalizePhoneNumber(phone?: string | null): string | null {
  if (!phone) return null;

  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return null;

  if (phone.trim().startsWith('+')) return `+${cleaned}`;
  if (cleaned.startsWith('94')) return `+${cleaned}`;
  if (cleaned.startsWith('0')) return `+94${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

async function sendPaymentConfirmationMessage(payment: {
  student_id: mongoose.Types.ObjectId | string;
  amount: number;
  payment_date?: string;
  payment_method?: string;
}): Promise<void> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (!accountSid || !authToken || !fromNumber) return;

    const student = await Student.findById(payment.student_id)
      .select('full_name phone whatsapp_phone guardian_phone')
      .lean();

    const s = student as any;
    if (!s) return;

    const whatsappTo = normalizePhoneNumber(s.whatsapp_phone);
    const smsTo = normalizePhoneNumber(s.phone) || normalizePhoneNumber(s.guardian_phone) || whatsappTo;

    if (!whatsappTo && !smsTo) return;

    const dateText = payment.payment_date
      ? new Date(payment.payment_date).toLocaleDateString('en-US')
      : new Date().toLocaleDateString('en-US');

    const methodText = payment.payment_method ? ` via ${payment.payment_method.replace('_', ' ')}` : '';
    const message = `Payment received: $${Number(payment.amount).toFixed(2)} from ${s.full_name}${methodText} on ${dateText}. Thank you.`;

    const twilio = require('twilio')(accountSid, authToken);

    if (whatsappFrom && whatsappTo) {
      await twilio.messages.create({
        body: message,
        from: whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`,
        to: `whatsapp:${whatsappTo}`,
      });
      return;
    }

    if (smsTo) {
      await twilio.messages.create({
        body: message,
        from: fromNumber,
        to: smsTo,
      });
    }
  } catch (error) {
    console.error('Payment confirmation message failed:', error);
  }
}

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
    const payment = await FeePayment.create({
      ...input,
      fee_collection_type: input.fee_collection_type || 'monthly',
    });

    if ((input.status || 'pending') === 'paid') {
      await sendPaymentConfirmationMessage({
        student_id: payment.student_id,
        amount: payment.amount,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
      });
    }

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
    const updated = await FeePayment.findByIdAndUpdate(paymentId, {
      status: 'paid',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      payment_date: new Date().toISOString(),
    }, { new: true });

    if (updated) {
      await sendPaymentConfirmationMessage({
        student_id: updated.student_id,
        amount: updated.amount,
        payment_date: updated.payment_date,
        payment_method: updated.payment_method,
      });
    }

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

  const targetDateStr = targetMonth.toISOString().split('T')[0];
  const monthStartStr = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1).toISOString().split('T')[0];
  const monthlyDueDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 5).toISOString().split('T')[0];

  try {
    const enrollments = await Enrollment.find({ status: 'active' })
      .populate('class_id', 'fee_amount fee_collection_type')
      .lean({ virtuals: true });

    let count = 0;
    for (const enrollment of enrollments as any[]) {
      if (!enrollment.class_id?.fee_amount) continue;
      const amount = enrollment.custom_fee || enrollment.class_id.fee_amount;
      const feeCollectionType = enrollment.class_id.fee_collection_type || 'monthly';
      const paymentPeriod = feeCollectionType === 'daily' ? targetDateStr : monthStartStr;
      const dueDate = feeCollectionType === 'daily' ? targetDateStr : monthlyDueDate;

      const existing = await FeePayment.findOne({
        student_id: enrollment.student_id,
        class_id: enrollment.class_id._id,
        payment_month: paymentPeriod,
      });

      if (!existing) {
        await FeePayment.create({
          student_id: enrollment.student_id,
          class_id: enrollment.class_id._id,
          amount,
          fee_collection_type: feeCollectionType,
          status: 'pending',
          payment_month: paymentPeriod,
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
