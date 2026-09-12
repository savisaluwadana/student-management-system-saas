import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import Workspace from '@/lib/mongodb/models/Workspace';
import Institute from '@/lib/mongodb/models/Institute';
import { signToken } from '@/lib/auth/auth';

function createWorkspaceSlug(name: string) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'workspace';
  return `${base}-${randomBytes(3).toString('hex')}`;
}

export async function POST(request: Request) {
  let createdUserId: string | null = null;
  let createdWorkspaceId: string | null = null;

  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET is not set' }, { status: 500 });
    }

    await connectDB();
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password, full_name, workspace_name } = body || {};

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      full_name: String(full_name).trim(),
      role: 'admin',
    });
    createdUserId = user._id.toHexString();

    const workspaceName = String(workspace_name || `${full_name}'s Institute`).trim();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const workspace = await Workspace.create({
      name: workspaceName,
      slug: createWorkspaceSlug(workspaceName),
      owner_user_id: user._id,
      plan: 'professional',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt,
      billing_email: normalizedEmail,
      currency: 'LKR',
      timezone: 'Asia/Colombo',
      status: 'active',
    });
    createdWorkspaceId = workspace._id.toHexString();

    user.workspace_id = workspace._id;
    await user.save();

    await Institute.create({
      workspace_id: workspace._id,
      code: `MAIN-${randomBytes(3).toString('hex').toUpperCase()}`,
      name: 'Main Branch',
      email: normalizedEmail,
      status: 'active',
    });

    const token = signToken({
      id: user._id.toHexString(),
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      workspace_id: workspace._id.toHexString(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toHexString(),
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        workspace_id: workspace._id.toHexString(),
      },
      workspace: {
        id: workspace._id.toHexString(),
        name: workspace.name,
        plan: workspace.plan,
        trial_ends_at: workspace.trial_ends_at,
      },
    }, { status: 201 });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);

    if (createdWorkspaceId) {
      await Institute.deleteMany({ workspace_id: createdWorkspaceId }).catch(() => undefined);
      await Workspace.findByIdAndDelete(createdWorkspaceId).catch(() => undefined);
    }
    if (createdUserId) {
      await User.findByIdAndDelete(createdUserId).catch(() => undefined);
    }

    const message = error instanceof Error ? error.message : '';

    if (message.includes('JWT_SECRET')) {
      return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET is not set' }, { status: 500 });
    }
    if (message.includes('MONGODB_URI')) {
      return NextResponse.json({ error: 'Server misconfiguration: MONGODB_URI is not set' }, { status: 500 });
    }
    if (
      message.includes('querySrv') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('MongoNetworkError')
    ) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    if (message.toLowerCase().includes('authentication failed')) {
      return NextResponse.json({ error: 'Database authentication failed' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
