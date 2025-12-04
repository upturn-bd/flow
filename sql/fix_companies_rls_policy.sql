-- ==============================================================================
-- FIX COMPANIES TABLE RLS POLICY
-- ==============================================================================
-- This script adds a policy to allow regular employees to view their own company
-- information. Previously, only superadmins could access the companies table.
--
-- Problem: Regular users were getting "JSON object requested, multiple (or no) 
-- rows returned" error when trying to fetch their company info because RLS 
-- blocked access.
--
-- Author: Flow HRIS Team
-- Date: 2025-12-03
-- ==============================================================================

-- ==============================================================================
-- HELPER FUNCTION: Get employee's company_id without RLS issues
-- ==============================================================================

-- Create a security definer function to get employee's company_id
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION get_employee_company_id(check_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  emp_company_id INTEGER;
BEGIN
  SELECT company_id INTO emp_company_id
  FROM employees
  WHERE id = check_user_id;
  
  RETURN emp_company_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_employee_company_id(UUID) TO authenticated;

COMMENT ON FUNCTION get_employee_company_id IS 'Gets the company_id for an employee. Uses SECURITY DEFINER to bypass RLS.';

-- ==============================================================================
-- ADD POLICY: Allow employees to view their own company
-- ==============================================================================

-- Drop if exists (idempotent)
DROP POLICY IF EXISTS "Employees can view their own company" ON companies;

-- Allow employees to view their own company
CREATE POLICY "Employees can view their own company"
  ON companies
  FOR SELECT
  USING (
    id = get_employee_company_id()
    OR is_superadmin()
  );

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Companies RLS policy fix complete!';
  RAISE NOTICE '📋 Added policy: Employees can view their own company';
  RAISE NOTICE '⚡ Created helper function: get_employee_company_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Now regular employees can fetch their company information.';
END $$;
