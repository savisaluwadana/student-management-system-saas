import { NextResponse } from 'next/server';
import { generateMonthlyFees } from '@/lib/actions/payments';

export async function POST(request: Request) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target month from request or use current month
    const { targetMonth } = await request.json().catch(() => ({}));
    const month = targetMonth ? new Date(targetMonth) : new Date();

    const result = await generateMonthlyFees(month);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Generated ${result.count} fee records for ${month.toISOString().split('T')[0]}`,
        count: result.count,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in generate-fees cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
