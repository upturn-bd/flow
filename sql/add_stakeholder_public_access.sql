-- ============================================================================
-- Add Public Access Code for Stakeholders
-- ============================================================================
-- This migration adds support for public ticket creation by stakeholders
-- via a secure access code system.

-- Add access_code column to stakeholders table
-- This code allows stakeholders to access a public page to create tickets
ALTER TABLE stakeholders
ADD COLUMN IF NOT EXISTS access_code VARCHAR(32) UNIQUE;

-- Create index for faster lookups by access code
CREATE INDEX IF NOT EXISTS idx_stakeholders_access_code ON stakeholders(access_code);

-- Create index for company_id + access_code combination lookups
CREATE INDEX IF NOT EXISTS idx_stakeholders_company_access_code ON stakeholders(company_id, access_code);

-- Add created_from_public_page flag to stakeholder_issues
-- This tracks which tickets were created by stakeholders via the public page
ALTER TABLE stakeholder_issues
ADD COLUMN IF NOT EXISTS created_from_public_page BOOLEAN DEFAULT FALSE;

-- Create index for filtering public page tickets
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_created_from_public ON stakeholder_issues(created_from_public_page);

-- Function to generate a random access code
-- Format: 8 characters, alphanumeric, uppercase
CREATE OR REPLACE FUNCTION generate_stakeholder_access_code()
RETURNS VARCHAR(32) AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous characters
  result VARCHAR(32) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure unique access code generation
CREATE OR REPLACE FUNCTION ensure_unique_access_code(p_company_id INTEGER)
RETURNS VARCHAR(32) AS $$
DECLARE
  new_code VARCHAR(32);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a new code
    new_code := generate_stakeholder_access_code();
    
    -- Check if this code already exists for this company
    SELECT EXISTS(
      SELECT 1 FROM stakeholders 
      WHERE company_id = p_company_id 
      AND access_code = new_code
    ) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate access code for new stakeholders
CREATE OR REPLACE FUNCTION auto_generate_access_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if access_code is not already set
  IF NEW.access_code IS NULL THEN
    NEW.access_code := ensure_unique_access_code(NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_generate_access_code ON stakeholders;
CREATE TRIGGER trigger_auto_generate_access_code
  BEFORE INSERT ON stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_access_code();

-- Backfill access codes for existing stakeholders
-- Only update records that don't have an access code yet
DO $$
DECLARE
  stakeholder_record RECORD;
BEGIN
  FOR stakeholder_record IN 
    SELECT id, company_id 
    FROM stakeholders 
    WHERE access_code IS NULL
  LOOP
    UPDATE stakeholders
    SET access_code = ensure_unique_access_code(stakeholder_record.company_id)
    WHERE id = stakeholder_record.id;
  END LOOP;
END $$;

-- Make access_code NOT NULL after backfill (stakeholders must have access codes)
ALTER TABLE stakeholders
ALTER COLUMN access_code SET NOT NULL;

-- Add comment to describe the column
COMMENT ON COLUMN stakeholders.access_code IS 'Unique 8-character code for stakeholder public ticket access';
COMMENT ON COLUMN stakeholder_issues.created_from_public_page IS 'Flag indicating if ticket was created via public page';

-- Grant necessary permissions (adjust role names as needed)
-- GRANT SELECT, UPDATE ON stakeholders TO your_app_role;
-- GRANT INSERT ON stakeholder_issues TO your_app_role;
