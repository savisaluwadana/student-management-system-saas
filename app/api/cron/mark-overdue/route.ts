import { NextResponse } from 'next/server';
import { runMarkOverduePayments } from '@/lib/saas/jobs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runMarkOverduePayments();
    return NextResponse.json({
      success: true,
      message: `Marked ${result.updated} payments as overdue`,
      count: result.updated,
    });
  } catch (error) {
    console.error('Error in mark-overdue cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
