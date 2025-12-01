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
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_superadmins_user_id ON superadmins(user_id);
CREATE INDEX IF NOT EXISTS idx_superadmins_is_active ON superadmins(is_active);

-- Add comment
COMMENT ON TABLE superadmins IS 'Stores users who have superadmin access to manage the entire SaaS platform';
COMMENT ON COLUMN superadmins.user_id IS 'Reference to auth.users - the authenticated user with superadmin privileges';
COMMENT ON COLUMN superadmins.granted_by IS 'User who granted superadmin access';
COMMENT ON COLUMN superadmins.is_active IS 'Whether the superadmin access is currently active';

-- ==============================================================================
-- PART 2: HELPER FUNCTION (SECURITY DEFINER TO AVOID RLS RECURSION)
-- ==============================================================================

-- Function to check if a user is an active superadmin
-- SECURITY DEFINER allows it to bypass RLS and avoid infinite recursion
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

-- ==============================================================================
-- PART 3: RLS POLICIES
-- ==============================================================================

-- Enable RLS on superadmins table
ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view the superadmins table
-- Using the security definer function to avoid recursion
CREATE POLICY "Superadmins can view all superadmin records"
  ON superadmins
  FOR SELECT
  USING (is_superadmin());

-- Only superadmins can insert new superadmin records
CREATE POLICY "Superadmins can insert superadmin records"
  ON superadmins
  FOR INSERT
  WITH CHECK (is_superadmin());

-- Only superadmins can update superadmin records
CREATE POLICY "Superadmins can update superadmin records"
  ON superadmins
  FOR UPDATE
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Only superadmins can delete superadmin records
CREATE POLICY "Superadmins can delete superadmin records"
  ON superadmins
  FOR DELETE
  USING (is_superadmin());

-- ==============================================================================
-- PART 4: ADDITIONAL HELPER FUNCTIONS
-- ==============================================================================

-- Function to get superadmin info for a user
CREATE OR REPLACE FUNCTION get_superadmin_info(check_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id INTEGER,
  user_id UUID,
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


-- ==============================================================================
-- Updated Table Definition

create table public.superadmins (
  id serial not null,
  user_id uuid not null,
  granted_by uuid null,
  granted_at timestamp with time zone null default now(),
  notes text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint superadmins_pkey primary key (id),
  constraint superadmins_user_id_key unique (user_id),
  constraint superadmins_granted_by_fkey foreign KEY (granted_by) references auth.users (id),
  constraint superadmins_user_id_fkey1 foreign KEY (user_id) references employees (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_superadmins_user_id on public.superadmins using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_superadmins_is_active on public.superadmins using btree (is_active) TABLESPACE pg_default;

create trigger trigger_update_superadmins_updated_at BEFORE
update on superadmins for EACH row
execute FUNCTION update_superadmins_updated_at ();