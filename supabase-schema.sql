-- Student Management System SaaS Database Schema
-- Execute this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLES
-- =============================================

-- Profiles Table (extends auth.users)
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

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  date_of_birth DATE,
  address TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'graduated')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_code TEXT UNIQUE NOT NULL,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  schedule TEXT,
  monthly_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enrollments Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'dropped')),
  custom_fee DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Fee Payments Table
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_month DATE NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'partial')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other')),
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Transactions Table (Ledger)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_payment_id UUID NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'adjustment')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other')),
  transaction_reference TEXT,
  notes TEXT,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Communications Table
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'class', 'all')),
  recipient_id UUID,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'both')),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'scheduled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_joining_date ON students(joining_date);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_month ON fee_payments(payment_month);
CREATE INDEX IF NOT EXISTS idx_fee_payments_due_date ON fee_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON fee_payments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON communications
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Function to generate monthly fees
CREATE OR REPLACE FUNCTION generate_monthly_fees(target_month DATE)
RETURNS INTEGER AS $$
DECLARE
  enrollment_record RECORD;
  fee_amount DECIMAL(10, 2);
  created_count INTEGER := 0;
BEGIN
  FOR enrollment_record IN 
    SELECT e.id, e.student_id, e.class_id, e.custom_fee, c.monthly_fee
    FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    WHERE e.status = 'active'
    AND c.status = 'active'
  LOOP
    -- Use custom fee if set, otherwise use class monthly fee
    fee_amount := COALESCE(enrollment_record.custom_fee, enrollment_record.monthly_fee);
    
    -- Check if fee already exists for this month
    IF NOT EXISTS (
      SELECT 1 FROM fee_payments
      WHERE student_id = enrollment_record.student_id
      AND enrollment_id = enrollment_record.id
      AND payment_month = DATE_TRUNC('month', target_month)
    ) THEN
      -- Create fee payment record
      INSERT INTO fee_payments (
        student_id,
        enrollment_id,
        amount,
        payment_month,
        due_date,
        status
      ) VALUES (
        enrollment_record.student_id,
        enrollment_record.id,
        fee_amount,
        DATE_TRUNC('month', target_month),
        DATE_TRUNC('month', target_month) + INTERVAL '1 month' - INTERVAL '1 day',
        'unpaid'
      );
      created_count := created_count + 1;
    END IF;
  END LOOP;
  
  RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark overdue payments
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE fee_payments
  SET status = 'overdue'
  WHERE status = 'unpaid'
  AND due_date < CURRENT_DATE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS
-- =============================================

-- Student Payment Summary View
CREATE OR REPLACE VIEW student_payment_summary AS
SELECT 
  s.id as student_id,
  s.student_code,
  s.full_name,
  COUNT(fp.id) as total_payments,
  SUM(CASE WHEN fp.status = 'paid' THEN fp.amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN fp.status = 'unpaid' THEN fp.amount ELSE 0 END) as total_unpaid,
  SUM(CASE WHEN fp.status = 'overdue' THEN fp.amount ELSE 0 END) as total_overdue,
  SUM(CASE WHEN fp.status = 'partial' THEN fp.amount ELSE 0 END) as total_partial
FROM students s
LEFT JOIN fee_payments fp ON s.id = fp.student_id
GROUP BY s.id, s.student_code, s.full_name;

-- Class Enrollment Summary View
CREATE OR REPLACE VIEW class_enrollment_summary AS
SELECT 
  c.id as class_id,
  c.class_code,
  c.class_name,
  c.capacity,
  COUNT(e.id) FILTER (WHERE e.status = 'active') as active_enrollments,
  COUNT(e.id) as total_enrollments,
  c.capacity - COUNT(e.id) FILTER (WHERE e.status = 'active') as available_spots
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY c.id, c.class_code, c.class_name, c.capacity;

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can do everything with profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students Policies
CREATE POLICY "Students viewable by authenticated users"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage students"
  ON students FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Classes Policies
CREATE POLICY "Classes viewable by authenticated users"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage classes"
  ON classes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Enrollments Policies
CREATE POLICY "Enrollments viewable by authenticated users"
  ON enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage enrollments"
  ON enrollments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Fee Payments Policies
CREATE POLICY "Fee payments viewable by authenticated users"
  ON fee_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage fee payments"
  ON fee_payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Payment Transactions Policies
CREATE POLICY "Payment transactions viewable by authenticated users"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage payment transactions"
  ON payment_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Communications Policies
CREATE POLICY "Communications viewable by authenticated users"
  ON communications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage communications"
  ON communications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Activity Logs Policies
CREATE POLICY "Activity logs viewable by admins"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage activity logs"
  ON activity_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
