-- ==============================================================================
-- FIX SUPERADMIN RLS INFINITE RECURSION
-- ==============================================================================
-- This script fixes the infinite recursion issue in superadmins table RLS policies
-- by creating a SECURITY DEFINER function that bypasses RLS
--
-- Run this to fix existing database
-- ==============================================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Superadmins can view all superadmin records" ON superadmins;
DROP POLICY IF EXISTS "Superadmins can insert superadmin records" ON superadmins;
DROP POLICY IF EXISTS "Superadmins can update superadmin records" ON superadmins;
DROP POLICY IF EXISTS "Superadmins can delete superadmin records" ON superadmins;

-- Drop existing function if it exists (to recreate with correct signature)
DROP FUNCTION IF EXISTS is_superadmin(UUID);
DROP FUNCTION IF EXISTS is_superadmin();

-- Create SECURITY DEFINER function to check superadmin status
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM superadmins
    WHERE user_id = check_user_id
    AND is_active = TRUE
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_superadmin(UUID) TO authenticated;

COMMENT ON FUNCTION is_superadmin IS 'Checks if a user is an active superadmin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

-- Recreate policies using the security definer function
CREATE POLICY "Superadmins can view all superadmin records"
  ON superadmins
  FOR SELECT
  USING (is_superadmin());

CREATE POLICY "Superadmins can insert superadmin records"
  ON superadmins
  FOR INSERT
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins can update superadmin records"
  ON superadmins
  FOR UPDATE
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

CREATE POLICY "Superadmins can delete superadmin records"
  ON superadmins
  FOR DELETE
  USING (is_superadmin());
