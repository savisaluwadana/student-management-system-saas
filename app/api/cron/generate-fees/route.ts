import { NextResponse } from 'next/server';
import { validateCronAuthorization } from '@/lib/saas/cron';
import { runFeeGeneration } from '@/lib/saas/jobs';

export async function POST(request: Request) {
  try {
    const authorization = validateCronAuthorization(request);
    if (!authorization.ok) {
      return NextResponse.json(
        { error: authorization.error },
        { status: authorization.status }
      );
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
