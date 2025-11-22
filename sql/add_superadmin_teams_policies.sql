-- ==============================================================================
-- ADD SUPERADMIN POLICIES FOR CROSS-COMPANY MANAGEMENT
-- ==============================================================================
-- This script adds RLS policies to allow superadmins to manage data across
-- all companies, not just data in their own company.
--
-- What this does:
-- 1. Adds policies for companies table (view, create, update, delete)
-- 2. Adds policies for employees table (view all employees)
-- 3. Adds policies for teams table (view, create, update, delete)
-- 4. Adds policies for team_members table (view, add, update, remove)
-- 5. Adds policies for team_permissions table (view, add, update, delete)
-- 6. Adds policies for permissions table (view)
--
-- Author: Flow HRIS Team
-- Date: 2025-11-23
-- ==============================================================================

-- ==============================================================================
-- COMPANIES TABLE POLICIES
-- ==============================================================================

-- Allow superadmins to view all companies
DROP POLICY IF EXISTS "Superadmins can view all companies" ON companies;
CREATE POLICY "Superadmins can view all companies"
  ON companies
  FOR SELECT
  USING (is_superadmin());

-- Allow superadmins to create companies
DROP POLICY IF EXISTS "Superadmins can create companies" ON companies;
CREATE POLICY "Superadmins can create companies"
  ON companies
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Allow superadmins to update any company
DROP POLICY IF EXISTS "Superadmins can update companies" ON companies;
CREATE POLICY "Superadmins can update companies"
  ON companies
  FOR UPDATE
  USING (is_superadmin());

-- Allow superadmins to delete any company
DROP POLICY IF EXISTS "Superadmins can delete companies" ON companies;
CREATE POLICY "Superadmins can delete companies"
  ON companies
  FOR DELETE
  USING (is_superadmin());

-- ==============================================================================
-- EMPLOYEES TABLE POLICIES
-- ==============================================================================

-- Allow superadmins to view all employees across all companies
DROP POLICY IF EXISTS "Superadmins can view all employees" ON employees;
CREATE POLICY "Superadmins can view all employees"
  ON employees
  FOR SELECT
  USING (is_superadmin());

-- Allow superadmins to update employee records
DROP POLICY IF EXISTS "Superadmins can update employees" ON employees;
CREATE POLICY "Superadmins can update employees"
  ON employees
  FOR UPDATE
  USING (is_superadmin());

-- ==============================================================================
-- TEAMS TABLE POLICIES
-- ==============================================================================

-- Allow superadmins to view all teams across all companies
DROP POLICY IF EXISTS "Superadmins can view all teams" ON teams;
CREATE POLICY "Superadmins can view all teams"
  ON teams
  FOR SELECT
  USING (is_superadmin());

-- Allow superadmins to create teams in any company
DROP POLICY IF EXISTS "Superadmins can create teams" ON teams;
CREATE POLICY "Superadmins can create teams"
  ON teams
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Allow superadmins to update any team
DROP POLICY IF EXISTS "Superadmins can update teams" ON teams;
CREATE POLICY "Superadmins can update teams"
  ON teams
  FOR UPDATE
  USING (is_superadmin());

-- Allow superadmins to delete any team
DROP POLICY IF EXISTS "Superadmins can delete teams" ON teams;
CREATE POLICY "Superadmins can delete teams"
  ON teams
  FOR DELETE
  USING (is_superadmin());

-- ==============================================================================
-- TEAM MEMBERS TABLE POLICIES
-- ==============================================================================

-- Allow superadmins to view all team members
DROP POLICY IF EXISTS "Superadmins can view all team members" ON team_members;
CREATE POLICY "Superadmins can view all team members"
  ON team_members
  FOR SELECT
  USING (is_superadmin());

-- Allow superadmins to add members to any team
DROP POLICY IF EXISTS "Superadmins can add team members" ON team_members;
CREATE POLICY "Superadmins can add team members"
  ON team_members
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Allow superadmins to update team members
DROP POLICY IF EXISTS "Superadmins can update team members" ON team_members;
CREATE POLICY "Superadmins can update team members"
  ON team_members
  FOR UPDATE
  USING (is_superadmin());

-- Allow superadmins to remove members from any team
DROP POLICY IF EXISTS "Superadmins can remove team members" ON team_members;
CREATE POLICY "Superadmins can remove team members"
  ON team_members
  FOR DELETE
  USING (is_superadmin());

-- ==============================================================================
-- TEAM PERMISSIONS TABLE POLICIES
-- ==============================================================================

-- Allow superadmins to view all team permissions
DROP POLICY IF EXISTS "Superadmins can view all team permissions" ON team_permissions;
CREATE POLICY "Superadmins can view all team permissions"
  ON team_permissions
  FOR SELECT
  USING (is_superadmin());

-- Allow superadmins to add permissions to any team
DROP POLICY IF EXISTS "Superadmins can add team permissions" ON team_permissions;
CREATE POLICY "Superadmins can add team permissions"
  ON team_permissions
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Allow superadmins to update team permissions
DROP POLICY IF EXISTS "Superadmins can update team permissions" ON team_permissions;
CREATE POLICY "Superadmins can update team permissions"
  ON team_permissions
  FOR UPDATE
  USING (is_superadmin());

-- Allow superadmins to delete team permissions
DROP POLICY IF EXISTS "Superadmins can delete team permissions" ON team_permissions;
CREATE POLICY "Superadmins can delete team permissions"
  ON team_permissions
  FOR DELETE
  USING (is_superadmin());

-- ==============================================================================
-- PERMISSIONS TABLE POLICIES (for viewing available permissions)
-- ==============================================================================

-- Allow superadmins to view all permissions
DROP POLICY IF EXISTS "Superadmins can view all permissions" ON permissions;
CREATE POLICY "Superadmins can view all permissions"
  ON permissions
  FOR SELECT
  USING (is_superadmin());

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Superadmin cross-company management policies added successfully!';
  RAISE NOTICE '📋 Tables updated: companies, employees, teams, team_members, team_permissions, permissions';
  RAISE NOTICE '🔒 Superadmins can now:';
  RAISE NOTICE '   - View, create, update, delete all companies';
  RAISE NOTICE '   - View and update all employees across all companies';
  RAISE NOTICE '   - View, create, update, delete all teams across all companies';
  RAISE NOTICE '   - Manage team members across all companies';
  RAISE NOTICE '   - Manage team permissions across all companies';
  RAISE NOTICE '   - View all available permissions';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: You must run this migration on your Supabase database!';
  RAISE NOTICE '';
  RAISE NOTICE 'How to apply:';
  RAISE NOTICE '1. Go to your Supabase Dashboard → SQL Editor';
  RAISE NOTICE '2. Copy and paste this entire SQL file';
  RAISE NOTICE '3. Click "Run" to execute';
END $$;
