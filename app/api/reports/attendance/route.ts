import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!classId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'classId, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('class_code, class_name, subject')
      .eq('id', classId)
      .single();

    if (classError) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Get attendance data with student info
    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        date,
        status,
        students(student_code, full_name)
      `)
      .eq('class_id', classId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (attendanceError) {
      return NextResponse.json({ error: attendanceError.message }, { status: 500 });
    }

    // Process data for report
    const studentAttendance: Map<string, {
      code: string;
      name: string;
      records: { date: string; status: string }[]
    }> = new Map();

    for (const record of attendanceData || []) {
      const student = (record as any).students;
      const key = student.student_code;

      if (!studentAttendance.has(key)) {
        studentAttendance.set(key, {
          code: student.student_code,
          name: student.full_name,
          records: [],
        });
      }

      studentAttendance.get(key)!.records.push({
        date: record.date,
        status: record.status,
      });
    }

    // Get unique dates
    const dates = Array.from(new Set((attendanceData || []).map(r => r.date))).sort();

    // Generate HTML report
    const html = generateAttendanceReportHTML({
      classData,
      studentAttendance: Array.from(studentAttendance.values()),
      dates,
      startDate,
      endDate,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="attendance-report-${classData.class_code}.html"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating attendance report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateAttendanceReportHTML(data: {
  classData: { class_code: string; class_name: string; subject: string };
  studentAttendance: { code: string; name: string; records: { date: string; status: string }[] }[];
  dates: string[];
  startDate: string;
  endDate: string;
}) {
  const { classData, studentAttendance, dates, startDate, endDate } = data;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'late': return 'L';
      case 'excused': return 'E';
      default: return '-';
    }
  };

  const calculatePercentage = (records: { status: string }[]) => {
    if (records.length === 0) return 0;
    const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
    return Math.round((present / records.length) * 100);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Report - ${classData.class_name}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #000;
      padding-bottom: 20px;
    }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 5px 0; color: #666; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .info-item { text-align: center; }
    .info-item strong { display: block; font-size: 18px; }
    .info-item span { color: #666; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: center;
    }
    th {
      background: #000;
      color: #fff;
    }
    .student-name {
      text-align: left;
      min-width: 150px;
    }
    .present { color: #000; font-weight: bold; }
    .absent { color: #000; }
    .late { color: #666; }
    .excused { color: #999; }
    .percentage { font-weight: bold; }
    .percentage.high { color: #000; }
    .percentage.medium { color: #666; }
    .percentage.low { color: #333; background: #f0f0f0; }
    .legend {
      margin-top: 20px;
      display: flex;
      gap: 20px;
      justify-content: center;
    }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .footer {
      margin-top: 30px;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    @media print {
      .no-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: center;">
    <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <h1>Attendance Report</h1>
    <p>${classData.class_name} (${classData.class_code})</p>
    <p>Subject: ${classData.subject}</p>
    <p>Period: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <strong>${studentAttendance.length}</strong>
      <span>Total Students</span>
    </div>
    <div class="info-item">
      <strong>${dates.length}</strong>
      <span>Days Recorded</span>
    </div>
    <div class="info-item">
      <strong>${studentAttendance.length > 0 ? Math.round(studentAttendance.reduce((sum, s) => sum + calculatePercentage(s.records), 0) / studentAttendance.length) : 0}%</strong>
      <span>Average Attendance</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th class="student-name">Student Name</th>
        ${dates.map(d => `<th>${formatDate(d)}</th>`).join('')}
        <th>%</th>
      </tr>
    </thead>
    <tbody>
      ${studentAttendance.map(student => {
    const percentage = calculatePercentage(student.records);
    const percentageClass = percentage >= 80 ? 'high' : percentage >= 60 ? 'medium' : 'low';
    return `
          <tr>
            <td>${student.code}</td>
            <td class="student-name">${student.name}</td>
            ${dates.map(date => {
      const record = student.records.find(r => r.date === date);
      const status = record?.status || '';
      return `<td class="${status}">${getStatusSymbol(status)}</td>`;
    }).join('')}
            <td class="percentage ${percentageClass}">${percentage}%</td>
          </tr>
        `;
  }).join('')}
    </tbody>
  </table>

  <div class="legend">
    <div class="legend-item"><span class="present">✓</span> Present</div>
    <div class="legend-item"><span class="absent">✗</span> Absent</div>
    <div class="legend-item"><span class="late">L</span> Late</div>
    <div class="legend-item"><span class="excused">E</span> Excused</div>
    <div class="legend-item"><span>-</span> Not Marked</div>
  </div>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p>Student Management System</p>
  </div>
</body>
</html>
  `;
}
