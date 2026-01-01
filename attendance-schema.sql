-- Attendance System Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- =============================================
-- ATTENDANCE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure one attendance record per student per class per day
  UNIQUE(class_id, student_id, date)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- Student Attendance Summary View
CREATE OR REPLACE VIEW student_attendance_summary AS
SELECT 
  s.id as student_id,
  s.student_code,
  s.full_name as student_name,
  c.id as class_id,
  c.class_name,
  COUNT(a.id) as total_classes,
  COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
  COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
  COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
  COUNT(a.id) FILTER (WHERE a.status = 'excused') as excused_count,
  CASE 
    WHEN COUNT(a.id) > 0 
    THEN ROUND((COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC) * 100, 2)
    ELSE 0
  END as attendance_percentage
FROM students s
JOIN enrollments e ON s.id = e.student_id AND e.status = 'active'
JOIN classes c ON e.class_id = c.id
LEFT JOIN attendance a ON s.id = a.student_id AND c.id = a.class_id
GROUP BY s.id, s.student_code, s.full_name, c.id, c.class_name;

-- Class Attendance Summary View (by date)
CREATE OR REPLACE VIEW class_attendance_daily AS
SELECT 
  c.id as class_id,
  c.class_code,
  c.class_name,
  a.date,
  COUNT(a.id) as total_marked,
  COUNT(a.id) FILTER (WHERE a.status = 'present') as present_count,
  COUNT(a.id) FILTER (WHERE a.status = 'absent') as absent_count,
  COUNT(a.id) FILTER (WHERE a.status = 'late') as late_count,
  COUNT(a.id) FILTER (WHERE a.status = 'excused') as excused_count,
  CASE 
    WHEN COUNT(a.id) > 0 
    THEN ROUND((COUNT(a.id) FILTER (WHERE a.status IN ('present', 'late'))::NUMERIC / COUNT(a.id)::NUMERIC) * 100, 2)
    ELSE 0
  END as attendance_percentage
FROM classes c
LEFT JOIN attendance a ON c.id = a.class_id
WHERE a.date IS NOT NULL
GROUP BY c.id, c.class_code, c.class_name, a.date
ORDER BY a.date DESC;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Attendance viewable by authenticated users
CREATE POLICY "Attendance viewable by authenticated users"
  ON attendance FOR SELECT
  TO authenticated
  USING (true);

-- Admins and teachers can manage attendance
CREATE POLICY "Admins and teachers can manage attendance"
  ON attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );
