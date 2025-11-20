-- ==============================================================================
-- ADD STEP STATUS FIELD TO STAKEHOLDER PROCESS STEPS
-- ==============================================================================
-- This migration adds an optional status field configuration to process steps.
-- The status field allows tracking of step progress with configurable dropdown options.
--
-- Author: Flow HRIS Team
-- Date: November 19, 2025
-- ==============================================================================

-- Add status_field column to stakeholder_process_steps table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'stakeholder_process_steps' 
    AND column_name = 'status_field'
  ) THEN
    ALTER TABLE stakeholder_process_steps 
    ADD COLUMN status_field JSONB DEFAULT NULL;
    
    -- Add comment to explain the structure
    COMMENT ON COLUMN stakeholder_process_steps.status_field IS 
    'Optional status field configuration. Format: {"enabled": true, "label": "Status", "options": [{"label": "In Progress", "value": "in_progress"}]}';
  END IF;
END $$;

-- Create index for querying steps with status fields enabled
CREATE INDEX IF NOT EXISTS idx_stakeholder_process_steps_status_field 
ON stakeholder_process_steps USING GIN (status_field);

-- Example of how to enable status field for a step:
-- UPDATE stakeholder_process_steps 
-- SET status_field = '{
--   "enabled": true,
--   "label": "Status",
--   "options": [
--     {"label": "Not Started", "value": "not_started"},
--     {"label": "In Progress", "value": "in_progress"},
--     {"label": "Completed", "value": "completed"}
--   ]
-- }'::jsonb
-- WHERE id = <step_id>;
