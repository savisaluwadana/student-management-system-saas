import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import PasswordResetToken from '@/lib/mongodb/models/PasswordResetToken';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset token and new password are required.' }, { status: 400 });
    }

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ error: 'This reset link is invalid or expired.' }, { status: 410 });
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters.' }, { status: 400 });
    }

    await connectDB();
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOneAndUpdate(
      {
        token_hash: tokenHash,
        used_at: { $exists: false },
        expires_at: { $gt: new Date() },
      },
      { used_at: new Date() },
      { new: true }
    );

    if (!resetToken) {
      return NextResponse.json({ error: 'This reset link is invalid, expired, or already used.' }, { status: 410 });
    }

    const user = await User.findById(resetToken.user_id).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'This reset link is no longer valid.' }, { status: 410 });
    }

    user.password = password;
    user.auth_version = Number(user.auth_version || 0) + 1;
    await user.save();

    await PasswordResetToken.deleteMany({ user_id: user._id, _id: { $ne: resetToken._id } });

    const response = NextResponse.json({
      success: true,
      message: 'Password updated. Sign in with your new password.',
    });

    // Remove the browser's current session. auth_version also invalidates any
    // other outstanding JWTs for this user.
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Password reset confirmation failed:', error);
    return NextResponse.json({ error: 'Unable to reset password. Request a new link and try again.' }, { status: 500 });
  }
}
