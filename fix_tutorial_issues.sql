-- SQL Migration to fix Tutorial Section Issues

-- 1. Create the missing view for Tutorial Progress Summary
-- This view is required by the Tutorial Status page
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

-- 2. Fix RLS Policies for Profiles
-- Ensure all authenticated users can read profiles to allow Role checks to succeed
-- Without this, identifying if a user is an admin or teacher fails, breaking other policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 3. Ensure Tutorials are viewable
-- double check these policies exist and are correct
DROP POLICY IF EXISTS "Tutorials viewable by authenticated users" ON tutorials;
CREATE POLICY "Tutorials viewable by authenticated users"
  ON tutorials FOR SELECT
  TO authenticated
  USING (true);

-- 4. Ensure Tutorial Progress is viewable/manageable
DROP POLICY IF EXISTS "Tutorial progress viewable by authenticated users" ON tutorial_progress;
CREATE POLICY "Tutorial progress viewable by authenticated users"
  ON tutorial_progress FOR SELECT
  TO authenticated
  USING (true);

-- Allow students to update their own progress (if not already covered)
DROP POLICY IF EXISTS "Students can update own progress" ON tutorial_progress;
CREATE POLICY "Students can update own progress"
  ON tutorial_progress FOR UPDATE
  TO authenticated
  USING (student_id IN (SELECT id FROM students WHERE email = auth.email()));
