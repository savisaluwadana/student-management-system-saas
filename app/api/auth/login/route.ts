import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import { signToken } from '@/lib/auth/auth';

export async function POST(request: Request) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET is not set' }, { status: 500 });
    }

    await connectDB();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user and include password field (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (typeof (user as any).password !== 'string' || !(user as any).password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create JWT token
    const token = signToken({
      id: user._id.toHexString(),
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toHexString(),
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });

    // Set HttpOnly cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      return NextResponse.json({ error: 'Server misconfiguration: JWT_SECRET is not set' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
