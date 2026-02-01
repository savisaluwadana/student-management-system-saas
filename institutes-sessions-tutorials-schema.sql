-- Institutes, Sessions & Tutorials Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- =============================================
-- INSTITUTES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS institutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- SESSIONS TABLE (Class Time Slots)
-- =============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TUTORIALS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT,
  content_type TEXT CHECK (content_type IN ('video', 'document', 'link', 'other')),
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- TUTORIAL PROGRESS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS tutorial_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tutorial_id, student_id)
);

-- =============================================
-- ALTER STUDENTS TABLE - Add new fields
-- =============================================

ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS barcode TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS school TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- =============================================
-- ALTER CLASSES TABLE - Add institute reference
-- =============================================

ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES institutes(id) ON DELETE SET NULL;

-- =============================================
-- ALTER ATTENDANCE TABLE - Add session reference
-- =============================================

ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_institutes_status ON institutes(status);
CREATE INDEX IF NOT EXISTS idx_institutes_code ON institutes(code);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_tutorials_class_id ON tutorials(class_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_institute_id ON tutorials(institute_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_tutorial_id ON tutorial_progress(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_student_id ON tutorial_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_status ON tutorial_progress(status);
CREATE INDEX IF NOT EXISTS idx_students_barcode ON students(barcode);
CREATE INDEX IF NOT EXISTS idx_students_institute_id ON students(institute_id);
CREATE INDEX IF NOT EXISTS idx_classes_institute_id ON classes(institute_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_institutes_updated_at BEFORE UPDATE ON institutes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tutorial_progress_updated_at BEFORE UPDATE ON tutorial_progress
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- Tutorial Progress Summary
CREATE OR REPLACE VIEW tutorial_progress_summary AS
SELECT 
  t.id as tutorial_id,
  t.title,
  t.class_id,
  c.class_name,
  COUNT(tp.id) as total_students,
  COUNT(tp.id) FILTER (WHERE tp.status = 'completed') as completed_count,
  COUNT(tp.id) FILTER (WHERE tp.status = 'in_progress') as in_progress_count,
  COUNT(tp.id) FILTER (WHERE tp.status = 'not_started') as not_started_count,
  CASE 
    WHEN COUNT(tp.id) > 0 
    THEN ROUND((COUNT(tp.id) FILTER (WHERE tp.status = 'completed')::NUMERIC / COUNT(tp.id)::NUMERIC) * 100, 2)
    ELSE 0
  END as completion_percentage
FROM tutorials t
LEFT JOIN tutorial_progress tp ON t.id = tp.tutorial_id
LEFT JOIN classes c ON t.class_id = c.id
GROUP BY t.id, t.title, t.class_id, c.class_name;

-- Institute Summary View
CREATE OR REPLACE VIEW institute_summary AS
SELECT 
  i.id as institute_id,
  i.code,
  i.name,
  i.status,
  COUNT(DISTINCT s.id) as total_students,
  COUNT(DISTINCT c.id) as total_classes
FROM institutes i
LEFT JOIN students s ON i.id = s.institute_id
LEFT JOIN classes c ON i.id = c.institute_id
GROUP BY i.id, i.code, i.name, i.status;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;

-- Institutes Policies
CREATE POLICY "Institutes viewable by authenticated users"
  ON institutes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage institutes"
  ON institutes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sessions Policies
CREATE POLICY "Sessions viewable by authenticated users"
  ON sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage sessions"
  ON sessions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Tutorials Policies
CREATE POLICY "Tutorials viewable by authenticated users"
  ON tutorials FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage tutorials"
  ON tutorials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Tutorial Progress Policies
CREATE POLICY "Tutorial progress viewable by authenticated users"
  ON tutorial_progress FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage tutorial progress"
  ON tutorial_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- =============================================
-- FUNCTION: Generate Student Barcode
-- =============================================

CREATE OR REPLACE FUNCTION generate_student_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL THEN
    NEW.barcode := 'STU' || LPAD(NEXTVAL('student_barcode_seq')::TEXT, 8, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for barcodes
CREATE SEQUENCE IF NOT EXISTS student_barcode_seq START WITH 10000001;

-- Trigger to auto-generate barcode on student creation
CREATE TRIGGER generate_student_barcode_trigger
  BEFORE INSERT ON students
  FOR EACH ROW
  EXECUTE FUNCTION generate_student_barcode();
