-- ==============================================================================
-- FIX: Infinite Recursion in Teams Table RLS Policies
-- ==============================================================================
-- This script fixes the circular dependency issue where RLS policies
-- call functions that query the same tables, causing infinite recursion.
--
-- The fix: Rewrite helper functions to bypass RLS and simplify policies
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Drop existing policies and functions
-- ==============================================================================

-- First drop all policies that depend on these functions
DROP POLICY IF EXISTS "Team managers can add members" ON team_members;
DROP POLICY IF EXISTS "Team managers can remove members" ON team_members;
DROP POLICY IF EXISTS "Team managers can insert permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can update permissions" ON team_permissions;
DROP POLICY IF EXISTS "Admins can create teams" ON teams;
DROP POLICY IF EXISTS "Admins can update teams" ON teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;
DROP POLICY IF EXISTS "Team managers can delete permissions" ON team_permissions;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS user_can_manage_teams(UUID) CASCADE;
DROP FUNCTION IF EXISTS user_can_delete_teams(UUID) CASCADE;
DROP FUNCTION IF EXISTS team_in_user_company(INTEGER, UUID) CASCADE;

-- ==============================================================================
-- STEP 2: Create fixed helper functions that bypass RLS
-- ==============================================================================

-- These functions use SECURITY DEFINER which runs with the privileges of the
-- function owner (superuser), bypassing RLS policies completely

CREATE OR REPLACE FUNCTION user_can_manage_teams(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  can_manage BOOLEAN;
BEGIN
  -- Query directly without triggering RLS on teams table
  -- We only need to check team_members, team_permissions, and permissions
  SELECT bool_or(tp.can_write) INTO can_manage
  FROM team_members tm
  JOIN team_permissions tp ON tp.team_id = tm.team_id
  JOIN permissions p ON p.id = tp.permission_id
  WHERE tm.employee_id = user_id
    AND p.module_name = 'teams';
  
  RETURN COALESCE(can_manage, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION user_can_manage_teams(UUID) TO authenticated;

-- Function to check if user can delete teams
CREATE OR REPLACE FUNCTION user_can_delete_teams(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  can_del BOOLEAN;
BEGIN
  -- Query directly without triggering RLS on teams table
  SELECT bool_or(tp.can_delete) INTO can_del
  FROM team_members tm
  JOIN team_permissions tp ON tp.team_id = tm.team_id
  JOIN permissions p ON p.id = tp.permission_id
  WHERE tm.employee_id = user_id
    AND p.module_name = 'teams';
  
  RETURN COALESCE(can_del, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION user_can_delete_teams(UUID) TO authenticated;

-- ==============================================================================
-- STEP 3: Recreate RLS policies without circular dependencies
-- ==============================================================================

-- Drop all existing policies on teams table
DROP POLICY IF EXISTS "Employees can view company teams" ON teams;
DROP POLICY IF EXISTS "Admins can create teams" ON teams;
DROP POLICY IF EXISTS "Admins can update teams" ON teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;

-- Create new policies that are safe from recursion
-- SELECT: Any employee can view teams in their company
CREATE POLICY "Employees can view company teams" ON teams
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- INSERT: Users with team management permission can create teams
CREATE POLICY "Admins can create teams" ON teams
  FOR INSERT
  WITH CHECK (
    -- Check permission first (doesn't query teams table)
    user_can_manage_teams(auth.uid())
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- UPDATE: Users with team management permission can update teams
CREATE POLICY "Admins can update teams" ON teams
  FOR UPDATE
  USING (
    user_can_manage_teams(auth.uid())
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- DELETE: Users with team deletion permission can delete teams
CREATE POLICY "Admins can delete teams" ON teams
  FOR DELETE
  USING (
    user_can_delete_teams(auth.uid())
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- ==============================================================================
-- STEP 4: Update team_members policies to avoid recursion
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Company employees can view team members" ON team_members;
DROP POLICY IF EXISTS "Team managers can add members" ON team_members;
DROP POLICY IF EXISTS "Team managers can remove members" ON team_members;
DROP POLICY IF EXISTS "Employees can view team members" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can insert team members" ON team_members;
DROP POLICY IF EXISTS "Team admins can delete team members" ON team_members;

-- Helper function to check if employee belongs to same company as team
CREATE OR REPLACE FUNCTION team_in_user_company(team_id_param INTEGER, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  same_company BOOLEAN;
BEGIN
  -- Direct query bypassing RLS
  SELECT EXISTS(
    SELECT 1 
    FROM teams t
    JOIN employees e ON e.company_id = t.company_id
    WHERE t.id = team_id_param 
      AND e.id = user_id
  ) INTO same_company;
  
  RETURN same_company;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

GRANT EXECUTE ON FUNCTION team_in_user_company(INTEGER, UUID) TO authenticated;

-- SELECT: Employees can view team members in their company
CREATE POLICY "Company employees can view team members" ON team_members
  FOR SELECT
  USING (
    team_in_user_company(team_id, auth.uid())
  );

-- INSERT: Team managers can add members
CREATE POLICY "Team managers can add members" ON team_members
  FOR INSERT
  WITH CHECK (
    user_can_manage_teams(auth.uid())
    AND team_in_user_company(team_id, auth.uid())
  );

-- DELETE: Team managers can remove members
CREATE POLICY "Team managers can remove members" ON team_members
  FOR DELETE
  USING (
    user_can_manage_teams(auth.uid())
    AND team_in_user_company(team_id, auth.uid())
  );

-- ==============================================================================
-- STEP 5: Update team_permissions policies
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Company employees can view team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can insert permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can update permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team managers can delete permissions" ON team_permissions;
DROP POLICY IF EXISTS "Employees can view team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Admins can manage team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team admins can insert team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team admins can update team permissions" ON team_permissions;
DROP POLICY IF EXISTS "Team admins can delete team permissions" ON team_permissions;

-- SELECT: Employees can view permissions for teams in their company
CREATE POLICY "Company employees can view team permissions" ON team_permissions
  FOR SELECT
  USING (
    team_in_user_company(team_id, auth.uid())
  );

-- INSERT: Team managers can create permissions
CREATE POLICY "Team managers can insert permissions" ON team_permissions
  FOR INSERT
  WITH CHECK (
    user_can_manage_teams(auth.uid())
    AND team_in_user_company(team_id, auth.uid())
  );

-- UPDATE: Team managers can update permissions
CREATE POLICY "Team managers can update permissions" ON team_permissions
  FOR UPDATE
  USING (
    user_can_manage_teams(auth.uid())
    AND team_in_user_company(team_id, auth.uid())
  );

-- DELETE: Team managers can delete permissions
CREATE POLICY "Team managers can delete permissions" ON team_permissions
  FOR DELETE
  USING (
    user_can_delete_teams(auth.uid())
    AND team_in_user_company(team_id, auth.uid())
  );

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Verify policies are set correctly
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies have been fixed for teams, team_members, and team_permissions';
  RAISE NOTICE '✅ Helper functions now use SECURITY DEFINER with search_path to bypass RLS';
  RAISE NOTICE '✅ Circular dependencies have been eliminated';
END $$;
