-- ==============================================================================
-- FIX FOR INFINITE RECURSION IN PROFILES POLICY
-- ==============================================================================
-- The "Admins can do everything with profiles" policy was causing infinite recursion
-- because it applied to SELECT operations, which are used to check the policy itself.
-- We will replace it with specific policies for INSERT, UPDATE, and DELETE.
-- SELECT handling is already covered by "Public profiles are viewable by authenticated users".

-- 1. Drop the problematic policy
DROP POLICY IF EXISTS "Admins can do everything with profiles" ON profiles;

-- 2. Create separate policies for write operations
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
