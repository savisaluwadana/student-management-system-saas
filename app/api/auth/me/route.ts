import { NextResponse } from 'next/server';
import User from '@/lib/mongodb/models/User';
import { requireWorkspaceContext } from '@/lib/saas/workspace';

export async function GET() {
  try {
    const context = await requireWorkspaceContext();
    const user = await User.findById(context.user.id)
      .select('email full_name role phone avatar_url workspace_id')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = user as any;
    return NextResponse.json({
      id: data._id.toString(),
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      phone: data.phone,
      avatar_url: data.avatar_url,
      workspace_id: data.workspace_id?.toString() || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      message === 'Unauthorized' ||
      message === 'Invalid workspace' ||
      message === 'Workspace unavailable'
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
