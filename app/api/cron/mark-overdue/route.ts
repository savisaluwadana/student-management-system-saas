import { NextResponse } from 'next/server';
import { markOverduePayments } from '@/lib/actions/payments';

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await markOverduePayments();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} payments as overdue`,
        count: result.count,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in mark-overdue cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
