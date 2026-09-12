import { NextResponse } from 'next/server';
import { runFeeGeneration } from '@/lib/saas/jobs';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetMonth } = await request.json().catch(() => ({}));
    const month = targetMonth ? new Date(targetMonth) : new Date();
    if (Number.isNaN(month.getTime())) {
      return NextResponse.json({ error: 'Invalid targetMonth' }, { status: 400 });
    }

    const result = await runFeeGeneration(month);
    return NextResponse.json({
      success: true,
      message: `Generated ${result.created} fee records`,
      created: result.created,
      skipped: result.skipped,
      processed: result.processed,
      targetMonth: month.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error in generate-fees cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
