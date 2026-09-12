import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import mongoose from 'mongoose';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const paymentId = params.paymentId;
    if (!paymentId || !mongoose.isValidObjectId(paymentId)) {
      return NextResponse.json({ error: 'Valid payment ID is required' }, { status: 400 });
    }

    await connectDB();
    const context = await requireWorkspaceContext();
    const payment = await FeePayment.findOne(workspaceFilter(context, { _id: paymentId }))
      .populate('student_id', 'student_code full_name email phone guardian_name')
      .populate('class_id', 'class_code class_name subject')
      .lean({ virtuals: true });

    if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    const data = payment as any;
    if (data.status !== 'paid') {
      return NextResponse.json({ error: 'Receipt can only be generated for paid payments' }, { status: 400 });
    }

    return new NextResponse(generateReceiptHTML(data), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="receipt-${paymentId}.html"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function generateReceiptHTML(payment: any) {
  const student = payment.student_id;
  const classInfo = payment.class_id;
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount);
  const receiptNumber = `RCP-${payment._id.toString().slice(-8).toUpperCase()}`;

  const row = (label: string, value: unknown) => `
    <div class="row"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Academix receipt ${escapeHtml(receiptNumber)}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f4f5;color:#18181b;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.toolbar{padding:20px;text-align:center}.toolbar button{border:0;border-radius:999px;background:#18181b;color:white;padding:11px 18px;font-weight:700;cursor:pointer}.sheet{width:min(720px,calc(100% - 32px));margin:0 auto 40px;background:white;border:1px solid #e4e4e7;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.08)}.head{padding:34px;border-bottom:1px solid #e4e4e7;display:flex;justify-content:space-between;gap:24px}.brand{font-size:25px;font-weight:800;letter-spacing:-.04em}.muted{color:#71717a;font-size:13px}.receipt-no{text-align:right;font-size:13px}.receipt-no strong{display:block;font-size:15px;color:#18181b}.content{padding:34px}.section{margin-bottom:28px}.section h2{margin:0 0 12px;font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#71717a}.row{display:flex;justify-content:space-between;gap:24px;padding:10px 0;border-bottom:1px solid #f4f4f5}.label{color:#71717a}.value{text-align:right;font-weight:600}.total{margin-top:30px;padding:24px;border-radius:18px;background:#18181b;color:white;display:flex;align-items:center;justify-content:space-between}.total strong{font-size:26px}.paid{font-size:11px;font-weight:800;letter-spacing:.12em;background:white;color:#18181b;border-radius:999px;padding:6px 9px}.footer{padding:0 34px 34px;text-align:center;color:#71717a;font-size:12px}@media print{body{background:white}.toolbar{display:none}.sheet{width:100%;margin:0;border:0;border-radius:0;box-shadow:none}}
</style>
</head>
<body>
<div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div>
<main class="sheet">
  <header class="head"><div><div class="brand">Academix</div><div class="muted">Payment receipt</div></div><div class="receipt-no"><span class="muted">Receipt</span><strong>${escapeHtml(receiptNumber)}</strong></div></header>
  <div class="content">
    <section class="section"><h2>Student</h2>${row('Student ID', student?.student_code || 'N/A')}${row('Name', student?.full_name || 'N/A')}${student?.guardian_name ? row('Guardian', student.guardian_name) : ''}</section>
    ${classInfo ? `<section class="section"><h2>Class</h2>${row('Class', `${classInfo.class_name || ''} (${classInfo.class_code || ''})`)}${row('Subject', classInfo.subject || 'N/A')}</section>` : ''}
    <section class="section"><h2>Payment details</h2>${row('Payment for', formatDate(payment.payment_month))}${row('Due date', formatDate(payment.due_date))}${row('Paid on', formatDate(payment.payment_date))}${row('Method', payment.payment_method?.replaceAll('_',' ')?.toUpperCase() || 'N/A')}${payment.transaction_id ? row('Transaction ID', payment.transaction_id) : ''}</section>
    <div class="total"><div><div class="muted" style="color:#d4d4d8">Amount paid</div><strong>${escapeHtml(formatCurrency(Number(payment.amount)))}</strong></div><span class="paid">PAID</span></div>
  </div>
  <footer class="footer">Computer-generated receipt · ${escapeHtml(new Date().toLocaleString('en-LK'))}</footer>
</main>
</body>
</html>`;
}
