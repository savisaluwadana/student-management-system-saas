import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb/client';
import Class from '@/lib/mongodb/models/Class';
import AttendanceModel from '@/lib/mongodb/models/Attendance';
import mongoose from 'mongoose';
import { requireWorkspaceContext, workspaceFilter } from '@/lib/saas/workspace';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!classId || !startDate || !endDate || !mongoose.isValidObjectId(classId)) {
      return NextResponse.json({ error: 'Valid classId, startDate, and endDate are required' }, { status: 400 });
    }

    await connectDB();
    const context = await requireWorkspaceContext();

    const classDoc = await Class.findOne(workspaceFilter(context, { _id: classId }))
      .select('class_code class_name subject')
      .lean();
    if (!classDoc) return NextResponse.json({ error: 'Class not found' }, { status: 404 });

    const classData = classDoc as any;
    const attendanceRecords = await AttendanceModel.find(workspaceFilter(context, {
      class_id: classId,
      date: { $gte: startDate, $lte: endDate },
    }))
      .populate('student_id', 'student_code full_name')
      .sort({ date: 1 })
      .lean({ virtuals: true });

    const studentAttendance = new Map<string, { code: string; name: string; records: { date: string; status: string }[] }>();
    for (const record of attendanceRecords as any[]) {
      const student = record.student_id;
      if (!student) continue;
      const key = student._id?.toString() || student.student_code;
      if (!studentAttendance.has(key)) {
        studentAttendance.set(key, { code: student.student_code, name: student.full_name, records: [] });
      }
      studentAttendance.get(key)!.records.push({ date: record.date, status: record.status });
    }

    const dates = Array.from(new Set((attendanceRecords as any[]).map((record) => record.date))).sort();
    const html = generateAttendanceReportHTML({
      classData: {
        class_code: classData.class_code,
        class_name: classData.class_name,
        subject: classData.subject || '',
      },
      studentAttendance: Array.from(studentAttendance.values()),
      dates,
      startDate,
      endDate,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="attendance-report-${classData.class_code}.html"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Error generating attendance report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function generateAttendanceReportHTML(data: {
  classData: { class_code: string; class_name: string; subject: string };
  studentAttendance: { code: string; name: string; records: { date: string; status: string }[] }[];
  dates: string[];
  startDate: string;
  endDate: string;
}) {
  const { classData, studentAttendance, dates, startDate, endDate } = data;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' });
  const symbol = (status: string) => status === 'present' ? '✓' : status === 'absent' ? '✗' : status === 'late' ? 'L' : status === 'excused' ? 'E' : '–';
  const percentage = (records: { status: string }[]) => {
    if (!records.length) return 0;
    return Math.round((records.filter((record) => record.status === 'present' || record.status === 'late').length / records.length) * 100);
  };
  const average = studentAttendance.length
    ? Math.round(studentAttendance.reduce((sum, student) => sum + percentage(student.records), 0) / studentAttendance.length)
    : 0;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Attendance report</title><style>
  *{box-sizing:border-box}body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;margin:0;background:#f4f4f5;color:#18181b}.toolbar{text-align:center;padding:20px}.toolbar button{border:0;border-radius:999px;background:#18181b;color:#fff;padding:11px 18px;font-weight:700}.sheet{width:min(1180px,calc(100% - 32px));margin:0 auto 40px;background:#fff;border:1px solid #e4e4e7;border-radius:22px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,.07)}h1{margin:0;font-size:28px}.muted{color:#71717a}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:26px 0}.stat{border:1px solid #e4e4e7;border-radius:14px;padding:16px}.stat strong{display:block;font-size:22px}table{width:100%;border-collapse:collapse;font-size:12px;overflow:hidden}th,td{border-bottom:1px solid #e4e4e7;padding:9px;text-align:center}th{background:#18181b;color:#fff}.student{text-align:left;min-width:160px}.code{text-align:left}.pct{font-weight:800}.footer{text-align:center;color:#71717a;font-size:11px;margin-top:24px}@media print{body{background:#fff}.toolbar{display:none}.sheet{width:100%;margin:0;border:0;border-radius:0;box-shadow:none;padding:10px}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save as PDF</button></div><main class="sheet">
  <h1>Attendance report</h1><p class="muted">${escapeHtml(classData.class_name)} (${escapeHtml(classData.class_code)}) · ${escapeHtml(classData.subject)} · ${escapeHtml(formatDate(startDate))}–${escapeHtml(formatDate(endDate))}</p>
  <div class="summary"><div class="stat"><strong>${studentAttendance.length}</strong><span class="muted">Students</span></div><div class="stat"><strong>${dates.length}</strong><span class="muted">Recorded days</span></div><div class="stat"><strong>${average}%</strong><span class="muted">Average attendance</span></div></div>
  <table><thead><tr><th>Code</th><th class="student">Student</th>${dates.map((date) => `<th>${escapeHtml(formatDate(date))}</th>`).join('')}<th>%</th></tr></thead><tbody>
  ${studentAttendance.map((student) => `<tr><td class="code">${escapeHtml(student.code)}</td><td class="student">${escapeHtml(student.name)}</td>${dates.map((date) => `<td>${escapeHtml(symbol(student.records.find((record) => record.date === date)?.status || ''))}</td>`).join('')}<td class="pct">${percentage(student.records)}%</td></tr>`).join('')}
  </tbody></table><div class="footer">✓ Present · ✗ Absent · L Late · E Excused · Generated ${escapeHtml(new Date().toLocaleString('en-LK'))}</div></main></body></html>`;
}
