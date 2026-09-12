import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import FeePayment from '@/lib/mongodb/models/FeePayment';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const paymentId = params.paymentId;

    if (!paymentId || !mongoose.isValidObjectId(paymentId)) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    await connectDB();

    const payment = await FeePayment.findById(paymentId)
      .populate('student_id', 'student_code full_name email phone guardian_name')
      .populate('class_id', 'class_code class_name subject')
      .lean({ virtuals: true });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const p = payment as any;

    if (p.status !== 'paid') {
      return NextResponse.json({ error: 'Receipt can only be generated for paid payments' }, { status: 400 });
    }

    const html = generateReceiptHTML(p);

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="receipt-${paymentId}.html"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateReceiptHTML(payment: any) {
  const student = payment.student_id;
  const classInfo = payment.class_id;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 2,
    }).format(amount);

  const receiptNumber = `RCP-${payment._id.toString().slice(-8).toUpperCase()}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Academix receipt ${receiptNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f4f4f5; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #18181b; }
    .page { max-width: 720px; margin: 0 auto; padding: 48px 20px; }
    .actions { display: flex; justify-content: flex-end; margin-bottom: 16px; }
    .actions button { border: 0; border-radius: 10px; padding: 10px 16px; background: #18181b; color: white; font-weight: 700; cursor: pointer; }
    .receipt { overflow: hidden; border: 1px solid #e4e4e7; border-radius: 24px; background: white; box-shadow: 0 24px 70px rgba(24,24,27,.08); }
    .header { padding: 34px 36px 28px; background: #18181b; color: white; }
    .brand { font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; opacity: .75; }
    .header h1 { margin: 12px 0 6px; font-size: 30px; }
    .header p { margin: 0; color: #d4d4d8; }
    .receipt-number { display: inline-flex; margin-top: 20px; padding: 7px 11px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; font-size: 12px; font-weight: 700; }
    .body { padding: 32px 36px; }
    .section { margin-bottom: 28px; }
    .section-title { margin-bottom: 10px; color: #71717a; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .detail-row { display: flex; justify-content: space-between; gap: 24px; padding: 10px 0; border-bottom: 1px solid #f4f4f5; font-size: 14px; }
    .detail-label { color: #71717a; }
    .detail-value { text-align: right; font-weight: 650; }
    .amount-section { margin-top: 8px; padding: 22px; border-radius: 16px; background: #f4f4f5; }
    .total-row { display: flex; justify-content: space-between; gap: 20px; align-items: baseline; font-size: 14px; }
    .total-row strong { font-size: 28px; letter-spacing: -.03em; }
    .status-paid { display: inline-flex; margin-top: 12px; padding: 5px 9px; border-radius: 999px; background: #dcfce7; color: #166534; font-size: 11px; font-weight: 800; }
    .footer { padding: 20px 36px 28px; border-top: 1px solid #f4f4f5; color: #71717a; font-size: 11px; line-height: 1.6; }
    @media print {
      body { background: white; }
      .page { padding: 0; max-width: none; }
      .actions { display: none; }
      .receipt { border: 0; border-radius: 0; box-shadow: none; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="actions"><button onclick="window.print()">Print / Save PDF</button></div>
    <article class="receipt">
      <header class="header">
        <div class="brand">Academix</div>
        <h1>Payment receipt</h1>
        <p>Official record of a completed student payment.</p>
        <div class="receipt-number">${receiptNumber}</div>
      </header>

      <main class="body">
        <section class="section">
          <div class="section-title">Student</div>
          <div class="detail-row"><span class="detail-label">Student code</span><span class="detail-value">${student?.student_code || 'N/A'}</span></div>
          <div class="detail-row"><span class="detail-label">Student name</span><span class="detail-value">${student?.full_name || 'N/A'}</span></div>
          ${student?.guardian_name ? `<div class="detail-row"><span class="detail-label">Guardian</span><span class="detail-value">${student.guardian_name}</span></div>` : ''}
        </section>

        ${classInfo ? `<section class="section">
          <div class="section-title">Class</div>
          <div class="detail-row"><span class="detail-label">Class</span><span class="detail-value">${classInfo.class_name} (${classInfo.class_code})</span></div>
          <div class="detail-row"><span class="detail-label">Subject</span><span class="detail-value">${classInfo.subject}</span></div>
        </section>` : ''}

        <section class="section">
          <div class="section-title">Payment details</div>
          <div class="detail-row"><span class="detail-label">Payment for</span><span class="detail-value">${formatDate(payment.payment_month)}</span></div>
          <div class="detail-row"><span class="detail-label">Due date</span><span class="detail-value">${formatDate(payment.due_date)}</span></div>
          <div class="detail-row"><span class="detail-label">Payment date</span><span class="detail-value">${formatDate(payment.payment_date)}</span></div>
          <div class="detail-row"><span class="detail-label">Method</span><span class="detail-value">${payment.payment_method?.toUpperCase() || 'N/A'}</span></div>
          ${payment.transaction_id ? `<div class="detail-row"><span class="detail-label">Transaction ID</span><span class="detail-value">${payment.transaction_id}</span></div>` : ''}
        </section>

        <section class="amount-section">
          <div class="total-row"><span>Amount paid</span><strong>${formatCurrency(Number(payment.amount))}</strong></div>
          <span class="status-paid">PAID</span>
        </section>
      </main>

      <footer class="footer">
        This is a computer-generated receipt. Generated ${new Date().toLocaleString('en-LK')}.
      </footer>
    </article>
  </div>
</body>
</html>`;
}
