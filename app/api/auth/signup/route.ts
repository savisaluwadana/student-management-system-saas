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
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password, full_name, role = 'admin' } = body || {};

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
