-- ==============================================================================
-- SCHEMA MIGRATION / DOCUMENTATION
-- Objective: Ensure Students and Teachers can be assigned to multiple classes.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TEACHERS (Profiles)
-- Teachers are stored in the 'profiles' table with role='teacher'.
-- No extra table is strictly needed for the Teacher entity itself.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CLASSES
-- A Class belongs to a single "Primary" Teacher (One-to-Many).
-- This means a Teacher can be assigned to MULTIPLE classes (Class A -> Teacher 1, Class B -> Teacher 1).
-- If you need "Team Teaching" (Multiple Teachers per single Class), you would need a join table.
-- Based on current requirements, the 'teacher_id' column suffices for "Teacher teaches multiple classes".
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code TEXT UNIQUE NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Links to Teacher
  schedule TEXT,
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. STUDENTS
-- Basic student information.
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  -- ... other fields ...
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ENROLLMENTS (Student -> Classes)
-- This table enables the Many-to-Many relationship.
-- A Student can have multiple Enrollments (belong to multiple classes).
-- A Class can have multiple Enrollments (have multiple students).
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'dropped')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, class_id) -- Prevents duplicate enrollment in same class
);

-- ==============================================================================
-- MIGRATION CHECKS
-- Run these queries to ensure your schema is up to date.
-- ==============================================================================

-- Ensure classes has teacher_id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'teacher_id') THEN
        ALTER TABLE classes ADD COLUMN teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure enrollments exists
-- (The IF NOT EXISTS in CREATE TABLE handles creation, but explicit check implies idempotency)

-- ==============================================================================
-- EXAMPLE QUERIES
-- ==============================================================================

-- 1. Get all classes for a specific Teacher
-- SELECT * FROM classes WHERE teacher_id = '[TEACHER_UUID]';

-- 2. Get all classes for a specific Student
-- SELECT c.* 
-- FROM classes c
-- JOIN enrollments e ON c.id = e.class_id
-- WHERE e.student_id = '[STUDENT_UUID]' AND e.status = 'active';

-- 3. Assign a Student to multiple classes
-- INSERT INTO enrollments (student_id, class_id) VALUES 
-- ('[STUDENT_ID]', '[CLASS_ID_1]'),
-- ('[STUDENT_ID]', '[CLASS_ID_2]');

-- 4. Assign a Teacher to a Class (Update)
-- UPDATE classes SET teacher_id = '[TEACHER_ID]' WHERE id = '[CLASS_ID]';
