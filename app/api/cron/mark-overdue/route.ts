import { NextResponse } from 'next/server';
import { validateCronAuthorization } from '@/lib/saas/cron';
import { runMarkOverduePayments } from '@/lib/saas/jobs';

export async function POST(request: Request) {
  try {
    const authorization = validateCronAuthorization(request);
    if (!authorization.ok) {
      return NextResponse.json(
        { error: authorization.error },
        { status: authorization.status }
      );
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
