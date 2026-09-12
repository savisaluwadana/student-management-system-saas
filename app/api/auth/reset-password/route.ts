import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import PasswordResetToken from '@/lib/mongodb/models/PasswordResetToken';
import { sendEmail } from '@/lib/services/notifications/email';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_RESPONSE = {
  success: true,
  message: 'If an account exists for that email, a password reset link will be sent shortly.',
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !EMAIL_PATTERN.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select('_id email full_name').lean();

    // Deliberately return the same response when the account does not exist.
    if (!user) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const userData = user as any;
    const cooldownStart = new Date(Date.now() - 60 * 1000);
    const recentRequest = await PasswordResetToken.exists({
      user_id: userData._id,
      created_at: { $gte: cooldownStart },
      used_at: { $exists: false },
    });

    // Do not disclose whether a cooldown was hit.
    if (recentRequest) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await PasswordResetToken.deleteMany({ user_id: userData._id });
    const resetToken = await PasswordResetToken.create({
      user_id: userData._id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
    const requestOrigin = new URL(request.url).origin;
    const baseUrl = configuredBaseUrl || requestOrigin;
    const resetUrl = `${baseUrl}/reset-password/${rawToken}`;

    const delivery = await sendEmail({
      to: userData.email,
      subject: 'Reset your Academix password',
      message: [
        `Hi ${userData.full_name},`,
        '',
        'A password reset was requested for your Academix account.',
        `Reset your password: ${resetUrl}`,
        '',
        'This link expires in 30 minutes and can only be used once.',
        'If you did not request this reset, you can ignore this email.',
      ].join('\n'),
    });

    if (!delivery.success) {
      await PasswordResetToken.findByIdAndDelete(resetToken._id).catch(() => undefined);
      console.error('Password reset email delivery failed:', delivery.error);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error('Password reset request failed:', error);
    // Keep failures opaque so this endpoint cannot be used for account discovery.
    return NextResponse.json(GENERIC_RESPONSE);
  }
}
