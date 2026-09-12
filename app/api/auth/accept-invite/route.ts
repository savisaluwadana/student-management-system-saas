import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import TeamInvite from '@/lib/mongodb/models/TeamInvite';
import Workspace from '@/lib/mongodb/models/Workspace';
import User from '@/lib/mongodb/models/User';
import Class from '@/lib/mongodb/models/Class';
import ActivityLog from '@/lib/mongodb/models/ActivityLog';
import { signToken } from '@/lib/auth/auth';
import { getPlanDefinition } from '@/lib/saas/plans';

export async function POST(request: Request) {
  let createdUserId: string | null = null;

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

    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : undefined;

    if (!token || !fullName || !password) {
      return NextResponse.json({ error: 'Invite token, full name, and password are required' }, { status: 400 });
    }

    if (fullName.length < 2 || fullName.length > 100) {
      return NextResponse.json({ error: 'Full name must be between 2 and 100 characters' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invite = await TeamInvite.findOne({
      token_hash: tokenHash,
      accepted_at: { $exists: false },
      revoked_at: { $exists: false },
      expires_at: { $gt: new Date() },
    });

    if (!invite) {
      return NextResponse.json({ error: 'This invitation is invalid, expired, or has already been used' }, { status: 410 });
    }

    const workspace = await Workspace.findOne({ _id: invite.workspace_id, status: 'active' });
    if (!workspace) {
      return NextResponse.json({ error: 'This workspace is no longer available' }, { status: 410 });
    }

    if (!['trialing', 'active', 'past_due'].includes(workspace.subscription_status)) {
      return NextResponse.json({ error: 'This workspace is not accepting new team members' }, { status: 410 });
    }

    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }

    const plan = getPlanDefinition(workspace.plan);
    if (plan.teamMemberLimit !== null) {
      const currentTeamMembers = await User.countDocuments({ workspace_id: workspace._id });
      if (currentTeamMembers >= plan.teamMemberLimit) {
        return NextResponse.json({
          error: `The ${plan.name} workspace has reached its ${plan.teamMemberLimit}-member team limit.`,
        }, { status: 409 });
      }
    }

    const assignedClassIds = invite.role === 'teacher' ? invite.class_ids || [] : [];
    if (assignedClassIds.length > 0) {
      const validClassCount = await Class.countDocuments({
        _id: { $in: assignedClassIds },
        workspace_id: workspace._id,
      });
      if (validClassCount !== assignedClassIds.length) {
        return NextResponse.json({
          error: 'One or more classes assigned to this invitation are no longer available. Ask an administrator to resend the invitation.',
        }, { status: 409 });
      }
    }

    const user = await User.create({
      workspace_id: workspace._id,
      email: invite.email,
      password,
      full_name: fullName,
      phone,
      role: invite.role,
    });
    createdUserId = user._id.toHexString();

    if (assignedClassIds.length > 0) {
      await Class.updateMany(
        { _id: { $in: assignedClassIds }, workspace_id: workspace._id },
        { teacher_id: user._id }
      );
    }

    const accepted = await TeamInvite.findOneAndUpdate(
      {
        _id: invite._id,
        accepted_at: { $exists: false },
        revoked_at: { $exists: false },
      },
      { accepted_at: new Date() },
      { new: true }
    );

    if (!accepted) {
      await Class.updateMany({ teacher_id: user._id }, { $unset: { teacher_id: 1 } });
      await User.findByIdAndDelete(user._id);
      createdUserId = null;
      return NextResponse.json({ error: 'This invitation was already accepted' }, { status: 409 });
    }

    await ActivityLog.create({
      workspace_id: workspace._id,
      user_id: user._id,
      action: 'team.invite.accepted',
      entity_type: 'teacher',
      entity_id: user._id.toHexString(),
      description: `${user.full_name} joined the workspace as ${invite.role}`,
      metadata: {
        email: user.email,
        assigned_classes: assignedClassIds.length,
        invite_id: invite._id.toHexString(),
      },
    }).catch((error) => console.error('Invite acceptance audit log failed:', error));

    const tokenValue = signToken({
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
      },
    });

    response.cookies.set('auth_token', tokenValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    if (createdUserId) {
      await Class.updateMany({ teacher_id: createdUserId }, { $unset: { teacher_id: 1 } }).catch(() => undefined);
      await User.findByIdAndDelete(createdUserId).catch(() => undefined);
    }
    console.error('Invite acceptance error:', error);
    return NextResponse.json({ error: 'Unable to accept invitation' }, { status: 500 });
  }
}
