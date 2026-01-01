import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { paymentId: string } }
) {
    try {
        const paymentId = params.paymentId;

        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Get payment with student and enrollment info
        const { data: payment, error: paymentError } = await supabase
            .from('fee_payments')
            .select(`
        *,
        students(
          student_code,
          full_name,
          email,
          phone,
          guardian_name
        ),
        enrollments(
          classes(
            class_code,
            class_name,
            subject
          )
        )
      `)
            .eq('id', paymentId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Only generate receipt for paid payments
        if (payment.status !== 'paid') {
            return NextResponse.json(
                { error: 'Receipt can only be generated for paid payments' },
                { status: 400 }
            );
        }

        const html = generateReceiptHTML(payment);

        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Content-Disposition': `inline; filename="receipt-${paymentId}.html"`,
            },
        });
    } catch (error: any) {
        console.error('Error generating receipt:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

function generateReceiptHTML(payment: any) {
    const student = payment.students;
    const enrollment = payment.enrollments;
    const classInfo = enrollment?.classes;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const receiptNumber = `RCP-${payment.id.slice(0, 8).toUpperCase()}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${receiptNumber}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #000;
    }
    .receipt {
      border: 2px solid #000;
      padding: 30px;
    }
    .header {
      text-align: center;
      border-bottom: 1px solid #ccc;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .receipt-number {
      background: #000;
      color: #fff;
      padding: 10px 20px;
      display: inline-block;
      margin-top: 15px;
      font-weight: bold;
    }
    .section {
      margin: 20px 0;
    }
    .section-title {
      font-weight: bold;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
      margin-bottom: 10px;
      color: #333;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dotted #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      color: #666;
    }
    .detail-value {
      font-weight: 500;
    }
    .amount-section {
      background: #f9f9f9;
      padding: 20px;
      margin: 20px 0;
      border: 1px solid #eee;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 24px;
      font-weight: bold;
    }
    .status-paid {
      background: #000;
      color: #fff;
      padding: 5px 15px;
      display: inline-block;
      font-size: 14px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      color: #666;
      font-size: 12px;
    }
    .qr-placeholder {
      text-align: center;
      padding: 20px;
      border: 1px dashed #ccc;
      margin-top: 20px;
      color: #999;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
      .receipt { border: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="receipt">
    <div class="header">
      <h1>Student Management System</h1>
      <p>Payment Receipt</p>
      <div class="receipt-number">${receiptNumber}</div>
    </div>

    <div class="section">
      <div class="section-title">Student Information</div>
      <div class="detail-row">
        <span class="detail-label">Student Code</span>
        <span class="detail-value">${student?.student_code || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Student Name</span>
        <span class="detail-value">${student?.full_name || 'N/A'}</span>
      </div>
      ${student?.guardian_name ? `
      <div class="detail-row">
        <span class="detail-label">Guardian</span>
        <span class="detail-value">${student.guardian_name}</span>
      </div>
      ` : ''}
    </div>

    ${classInfo ? `
    <div class="section">
      <div class="section-title">Class Information</div>
      <div class="detail-row">
        <span class="detail-label">Class</span>
        <span class="detail-value">${classInfo.class_name} (${classInfo.class_code})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Subject</span>
        <span class="detail-value">${classInfo.subject}</span>
      </div>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Payment Details</div>
      <div class="detail-row">
        <span class="detail-label">Payment For</span>
        <span class="detail-value">${formatDate(payment.payment_month)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Due Date</span>
        <span class="detail-value">${formatDate(payment.due_date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Date</span>
        <span class="detail-value">${formatDate(payment.payment_date)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Payment Method</span>
        <span class="detail-value">${payment.payment_method?.toUpperCase() || 'N/A'}</span>
      </div>
      ${payment.transaction_id ? `
      <div class="detail-row">
        <span class="detail-label">Transaction ID</span>
        <span class="detail-value">${payment.transaction_id}</span>
      </div>
      ` : ''}
    </div>

    <div class="amount-section">
      <div class="total-row">
        <span>Amount Paid</span>
        <span>${formatCurrency(Number(payment.amount))}</span>
      </div>
      <div style="text-align: right; margin-top: 10px;">
        <span class="status-paid">PAID</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for your payment!</p>
      <p>This is a computer-generated receipt and does not require a signature.</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}
