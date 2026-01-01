-- Assessments & Grading Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- =============================================
-- ASSESSMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('exam', 'quiz', 'assignment', 'project', 'midterm', 'final')),
  max_score DECIMAL(10, 2) NOT NULL DEFAULT 100,
  weight DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
  date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- GRADES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score DECIMAL(10, 2),
  remarks TEXT,
  graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One grade per student per assessment
  UNIQUE(assessment_id, student_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(date);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- VIEWS
-- =============================================

-- Student Report Card View (grades per class)
CREATE OR REPLACE VIEW student_class_grades AS
SELECT 
  s.id as student_id,
  s.student_code,
  s.full_name as student_name,
  c.id as class_id,
  c.class_name,
  c.subject,
  a.id as assessment_id,
  a.title as assessment_title,
  a.assessment_type,
  a.max_score,
  a.weight,
  a.date as assessment_date,
  g.score,
  g.remarks,
  CASE 
    WHEN a.max_score > 0 THEN ROUND((g.score / a.max_score) * 100, 2)
    ELSE 0
  END as percentage
FROM students s
JOIN enrollments e ON s.id = e.student_id AND e.status = 'active'
JOIN classes c ON e.class_id = c.id
LEFT JOIN assessments a ON c.id = a.class_id
LEFT JOIN grades g ON a.id = g.assessment_id AND s.id = g.student_id
ORDER BY s.student_code, c.class_name, a.date;

-- Class Assessment Summary View
CREATE OR REPLACE VIEW class_assessment_summary AS
SELECT 
  a.id as assessment_id,
  a.title,
  a.assessment_type,
  a.max_score,
  a.date,
  c.id as class_id,
  c.class_name,
  COUNT(g.id) as graded_count,
  COUNT(e.id) as total_students,
  ROUND(AVG(g.score), 2) as average_score,
  ROUND(MAX(g.score), 2) as highest_score,
  ROUND(MIN(g.score), 2) as lowest_score,
  CASE 
    WHEN a.max_score > 0 THEN ROUND((AVG(g.score) / a.max_score) * 100, 2)
    ELSE 0
  END as average_percentage
FROM assessments a
JOIN classes c ON a.class_id = c.id
LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
LEFT JOIN grades g ON a.id = g.assessment_id
GROUP BY a.id, a.title, a.assessment_type, a.max_score, a.date, c.id, c.class_name;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- Assessments viewable by authenticated users
CREATE POLICY "Assessments viewable by authenticated users"
  ON assessments FOR SELECT
  TO authenticated
  USING (true);

-- Admins and teachers can manage assessments
CREATE POLICY "Admins and teachers can manage assessments"
  ON assessments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Grades viewable by authenticated users
CREATE POLICY "Grades viewable by authenticated users"
  ON grades FOR SELECT
  TO authenticated
  USING (true);

-- Admins and teachers can manage grades
CREATE POLICY "Admins and teachers can manage grades"
  ON grades FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );
