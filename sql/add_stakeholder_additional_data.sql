-- ==============================================================================
-- ADD ADDITIONAL_DATA COLUMN TO STAKEHOLDERS TABLE
-- ==============================================================================
-- This migration adds an additional_data column to the stakeholders table
-- to store permanent stakeholder data selected from completed step data.
--
-- Author: Flow HRIS Team
-- Date: November 10, 2025
-- ==============================================================================

-- Add additional_data column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholders' 
    AND column_name = 'additional_data'
  ) THEN
    ALTER TABLE stakeholders 
    ADD COLUMN additional_data JSONB DEFAULT '{}';
    
    -- Add GIN index for efficient querying of JSONB data
    CREATE INDEX idx_stakeholders_additional_data ON stakeholders USING GIN (additional_data);
    
    -- Add comment to document the column
    COMMENT ON COLUMN stakeholders.additional_data IS 
      'Additional key-value data for permanent stakeholders. Format: {"key": "value", ...}. 
      This data is typically selected from completed step data fields or manually added.';
  END IF;
END $$;
