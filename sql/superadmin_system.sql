-- ==============================================================================
-- SUPERADMIN SYSTEM SETUP
-- ==============================================================================
-- This script sets up the superadmin system for SaaS owners to manage
-- companies, teams, users, countries, and industries.
--
-- What this does:
-- 1. Creates superadmins table
-- 2. Sets up RLS policies
-- 3. Creates helper functions for efficient checks
-- 4. Creates indexes for performance
--
-- Author: Flow HRIS Team
-- Date: 2025-11-22
-- Version: 1.0
-- ==============================================================================

-- ==============================================================================
-- PART 1: CREATE SUPERADMINS TABLE
-- ==============================================================================

-- Table to store superadmin users
CREATE TABLE IF NOT EXISTS superadmins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_superadmins_user_id ON superadmins(user_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_employee_id ON superadmins(employee_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_is_active ON superadmins(is_active);

-- Add comment
COMMENT ON TABLE superadmins IS 'Stores users who have superadmin access to manage the entire SaaS platform';
COMMENT ON COLUMN superadmins.user_id IS 'Reference to auth.users - the authenticated user with superadmin privileges';
COMMENT ON COLUMN superadmins.employee_id IS 'Optional reference to employees table if superadmin is also an employee';
COMMENT ON COLUMN superadmins.granted_by IS 'User who granted superadmin access';
COMMENT ON COLUMN superadmins.is_active IS 'Whether the superadmin access is currently active';

-- ==============================================================================
-- PART 2: RLS POLICIES
-- ==============================================================================

-- Enable RLS on superadmins table
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view the superadmins table
CREATE POLICY "Superadmins can view all superadmin records"
  ON superadmins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM superadmins sa
      WHERE sa.user_id = auth.uid()
      AND sa.is_active = TRUE
    )
  );

-- Only superadmins can insert new superadmin records
CREATE POLICY "Superadmins can insert superadmin records"
  ON superadmins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmins sa
      WHERE sa.user_id = auth.uid()
      AND sa.is_active = TRUE
    )
  );

-- Only superadmins can update superadmin records
CREATE POLICY "Superadmins can update superadmin records"
  ON superadmins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM superadmins sa
      WHERE sa.user_id = auth.uid()
      AND sa.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM superadmins sa
      WHERE sa.user_id = auth.uid()
      AND sa.is_active = TRUE
    )
  );

-- Only superadmins can delete superadmin records
CREATE POLICY "Superadmins can delete superadmin records"
  ON superadmins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM superadmins sa
      WHERE sa.user_id = auth.uid()
      AND sa.is_active = TRUE
    )
  );

-- ==============================================================================
-- PART 3: HELPER FUNCTIONS
-- ==============================================================================

-- Function to check if a user is a superadmin
CREATE OR REPLACE FUNCTION is_superadmin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  -- Return true if user is an active superadmin
  RETURN EXISTS (
    SELECT 1 
    FROM superadmins 
    WHERE user_id = target_user_id 
    AND is_active = TRUE
  );
END;
$$;

COMMENT ON FUNCTION is_superadmin IS 'Check if a user has active superadmin privileges';

-- Function to get superadmin info for a user
CREATE OR REPLACE FUNCTION get_superadmin_info(check_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
  employee_id UUID,
  granted_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(check_user_id, auth.uid());
  
  -- Return superadmin info if exists
  RETURN QUERY
  SELECT 
    sa.id,
    sa.user_id,
    sa.employee_id,
    sa.granted_at,
    sa.is_active
  FROM superadmins sa
  WHERE sa.user_id = target_user_id
  AND sa.is_active = TRUE;
END;
$$;

COMMENT ON FUNCTION get_superadmin_info IS 'Get superadmin information for a user';

-- ==============================================================================
-- PART 4: GRANT PERMISSIONS
-- ==============================================================================

-- Grant usage on the functions to authenticated users
GRANT EXECUTE ON FUNCTION is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION get_superadmin_info TO authenticated;

-- Grant access to the superadmins table to authenticated users
-- (RLS policies will handle actual access control)
GRANT SELECT, INSERT, UPDATE, DELETE ON superadmins TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE superadmins_id_seq TO authenticated;

-- ==============================================================================
-- PART 5: CREATE TRIGGER FOR UPDATED_AT
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_superadmins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_superadmins_updated_at ON superadmins;

CREATE TRIGGER trigger_update_superadmins_updated_at
  BEFORE UPDATE ON superadmins
  FOR EACH ROW
  EXECUTE FUNCTION update_superadmins_updated_at();

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE '✅ Superadmin system setup complete!';
  RAISE NOTICE '📋 Created tables: superadmins';
  RAISE NOTICE '🔒 RLS policies enabled';
  RAISE NOTICE '⚡ Helper functions created: is_superadmin, get_superadmin_info';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Add your first superadmin user manually via SQL';
  RAISE NOTICE '2. Update middleware to check superadmin status';
  RAISE NOTICE '3. Create /sa routes for superadmin interface';
END $$;
