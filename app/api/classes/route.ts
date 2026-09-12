import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import Class from '@/lib/mongodb/models/Class';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export async function GET() {
  try {
    await connectDB();
    const context = await requireWorkspaceContext();
    const classes = await Class.find(workspaceFilter(context, { status: 'active' }))
      .select('id class_code class_name subject')
      .sort({ class_name: 1 })
      .lean({ virtuals: true });

    return NextResponse.json(
      (classes as any[]).map((classItem) => ({ ...classItem, id: classItem._id.toString() }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
