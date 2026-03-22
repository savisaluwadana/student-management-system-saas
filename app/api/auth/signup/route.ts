import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import User from '@/lib/mongodb/models/User';
import { signToken } from '@/lib/auth/auth';

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, password, full_name, role = 'admin' } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Create new user (password is hashed by the pre-save hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      full_name,
      role,
    });

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
    }, { status: 201 });

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
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
