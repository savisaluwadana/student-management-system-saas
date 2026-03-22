import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import Class from '@/lib/mongodb/models/Class';

export async function GET() {
  try {
    await connectDB();
    const classes = await Class.find({ status: 'active' })
      .select('id class_code class_name subject')
      .sort({ class_name: 1 })
      .lean({ virtuals: true });

    return NextResponse.json(
      (classes as any[]).map((c) => ({ ...c, id: c._id.toString() }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
