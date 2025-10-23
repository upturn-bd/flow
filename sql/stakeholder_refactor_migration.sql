-- ==============================================================================
-- STAKEHOLDER SYSTEM REFACTOR MIGRATION
-- ==============================================================================
-- This script completely replaces the old stakeholder system with a new
-- process-based system where stakeholders (leads) progress through defined steps.
--
-- WARNING: This will DROP all existing stakeholder data!
-- Author: Flow HRIS Team
-- Date: October 23, 2025
-- ==============================================================================

-- ==============================================================================
-- PART 1: DROP OLD STAKEHOLDER TABLES
-- ==============================================================================

DROP TABLE IF EXISTS stakeholder_issues CASCADE;
DROP TABLE IF EXISTS stakeholders CASCADE;
DROP TABLE IF EXISTS stakeholder_types CASCADE;

-- ==============================================================================
-- PART 2: ADD FILE SIZE LIMIT TO COMPANIES TABLE
-- ==============================================================================

-- Add file_size_limit_mb column to companies table if it doesn't exist
-- Default to 10MB, this is used for stakeholder file uploads
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' 
    AND column_name = 'file_size_limit_mb'
  ) THEN
    ALTER TABLE companies ADD COLUMN file_size_limit_mb INTEGER DEFAULT 10;
  END IF;
END $$;

-- ==============================================================================
-- PART 3: CREATE NEW STAKEHOLDER SYSTEM TABLES
-- ==============================================================================

-- 3.1 Stakeholder Processes Table
-- Defines the workflow/process that stakeholders will follow
CREATE TABLE stakeholder_processes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  is_sequential BOOLEAN DEFAULT TRUE, -- If true, steps must be completed in order
  allow_rollback BOOLEAN DEFAULT FALSE, -- If true, can go back to previous steps (only for sequential)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  CONSTRAINT unique_process_name_per_company UNIQUE(name, company_id)
);

CREATE INDEX idx_stakeholder_processes_company_id ON stakeholder_processes(company_id);
CREATE INDEX idx_stakeholder_processes_is_active ON stakeholder_processes(is_active);
CREATE INDEX idx_stakeholder_processes_created_by ON stakeholder_processes(created_by);

-- 3.2 Stakeholder Process Steps Table
-- Defines individual steps within a process
CREATE TABLE stakeholder_process_steps (
  id SERIAL PRIMARY KEY,
  process_id INTEGER NOT NULL REFERENCES stakeholder_processes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL, -- Order of the step in the process (for sequential processes)
  team_id INTEGER NOT NULL REFERENCES teams(id), -- Team responsible for this step
  
  -- Field definitions for this step (JSONB structure)
  -- Format: {"fields": [{"key": "field1", "label": "Field Label", "type": "text|boolean|date|file", "required": true, "validation": {...}}]}
  field_definitions JSONB DEFAULT '{"fields": []}',
  
  -- Optional date range for step validity
  use_date_range BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  
  -- Version tracking for backward compatibility when processes are edited
  version INTEGER DEFAULT 1,
  
  CONSTRAINT unique_step_order_per_process UNIQUE(process_id, step_order)
);

CREATE INDEX idx_stakeholder_process_steps_process_id ON stakeholder_process_steps(process_id);
CREATE INDEX idx_stakeholder_process_steps_team_id ON stakeholder_process_steps(team_id);
CREATE INDEX idx_stakeholder_process_steps_step_order ON stakeholder_process_steps(process_id, step_order);
CREATE INDEX idx_stakeholder_process_steps_field_definitions ON stakeholder_process_steps USING GIN (field_definitions);

-- 3.3 Stakeholders Table (Main entity)
-- Stakeholders are called "Leads" until all steps are completed
CREATE TABLE stakeholders (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  address TEXT,
  
  -- Contact persons (JSONB array)
  -- Format: [{"name": "John Doe", "phone": "+1234567890", "email": "john@example.com"}]
  contact_persons JSONB DEFAULT '[]',
  
  -- Process tracking
  process_id INTEGER NOT NULL REFERENCES stakeholder_processes(id),
  current_step_id INTEGER REFERENCES stakeholder_process_steps(id), -- NULL if not started yet
  current_step_order INTEGER DEFAULT 0, -- Track which step number they're on
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_completed BOOLEAN DEFAULT FALSE, -- True when all steps are completed
  completed_at TIMESTAMP WITH TIME ZONE, -- When all steps were completed
  
  -- Company & Audit
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID
);

CREATE INDEX idx_stakeholders_company_id ON stakeholders(company_id);
CREATE INDEX idx_stakeholders_process_id ON stakeholders(process_id);
CREATE INDEX idx_stakeholders_current_step_id ON stakeholders(current_step_id);
CREATE INDEX idx_stakeholders_is_completed ON stakeholders(is_completed);
CREATE INDEX idx_stakeholders_is_active ON stakeholders(is_active);
CREATE INDEX idx_stakeholders_contact_persons ON stakeholders USING GIN (contact_persons);

-- 3.4 Stakeholder Step Data Table
-- Stores the actual data for each step for each stakeholder
CREATE TABLE stakeholder_step_data (
  id SERIAL PRIMARY KEY,
  stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id) ON DELETE CASCADE,
  step_id INTEGER NOT NULL REFERENCES stakeholder_process_steps(id) ON DELETE CASCADE,
  
  -- Actual data entered for this step's fields
  -- Format matches the keys from field_definitions: {"field1": "value", "field2": true, "field3": "2025-10-23"}
  data JSONB DEFAULT '{}',
  
  -- Store the field definitions version used when this data was saved
  -- This enables backward compatibility when process steps are edited
  field_definitions_snapshot JSONB,
  step_version INTEGER,
  
  -- Completion tracking
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES employees(id),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID,
  
  CONSTRAINT unique_stakeholder_step UNIQUE(stakeholder_id, step_id)
);

CREATE INDEX idx_stakeholder_step_data_stakeholder_id ON stakeholder_step_data(stakeholder_id);
CREATE INDEX idx_stakeholder_step_data_step_id ON stakeholder_step_data(step_id);
CREATE INDEX idx_stakeholder_step_data_is_completed ON stakeholder_step_data(is_completed);
CREATE INDEX idx_stakeholder_step_data_data ON stakeholder_step_data USING GIN (data);

-- ==============================================================================
-- PART 4: UPDATE TRIGGERS
-- ==============================================================================

-- Assuming update_updated_at_column() function exists from other migrations
CREATE TRIGGER update_stakeholder_processes_updated_at
  BEFORE UPDATE ON stakeholder_processes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholder_process_steps_updated_at
  BEFORE UPDATE ON stakeholder_process_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholders_updated_at
  BEFORE UPDATE ON stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stakeholder_step_data_updated_at
  BEFORE UPDATE ON stakeholder_step_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- PART 5: HELPER FUNCTIONS
-- ==============================================================================

-- 5.1 Function to auto-update stakeholder completion status
CREATE OR REPLACE FUNCTION check_stakeholder_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_steps INTEGER;
  completed_steps INTEGER;
  stakeholder_process_id INTEGER;
BEGIN
  -- Get the process_id for this stakeholder
  SELECT process_id INTO stakeholder_process_id
  FROM stakeholders
  WHERE id = NEW.stakeholder_id;
  
  -- Count total steps in the process
  SELECT COUNT(*) INTO total_steps
  FROM stakeholder_process_steps
  WHERE process_id = stakeholder_process_id;
  
  -- Count completed steps for this stakeholder
  SELECT COUNT(*) INTO completed_steps
  FROM stakeholder_step_data
  WHERE stakeholder_id = NEW.stakeholder_id
    AND is_completed = TRUE;
  
  -- If all steps are completed, mark stakeholder as completed
  IF completed_steps >= total_steps THEN
    UPDATE stakeholders
    SET 
      is_completed = TRUE,
      completed_at = NOW()
    WHERE id = NEW.stakeholder_id
      AND is_completed = FALSE; -- Only update if not already marked
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_stakeholder_completion
  AFTER UPDATE OF is_completed ON stakeholder_step_data
  FOR EACH ROW
  WHEN (NEW.is_completed = TRUE)
  EXECUTE FUNCTION check_stakeholder_completion();

-- 5.2 Function to update current_step_id when a step is completed (for sequential processes)
CREATE OR REPLACE FUNCTION update_current_step()
RETURNS TRIGGER AS $$
DECLARE
  is_process_sequential BOOLEAN;
  next_step_order INTEGER;
  next_step INTEGER;
BEGIN
  -- Only proceed if step was just completed
  IF NEW.is_completed = TRUE AND (OLD.is_completed = FALSE OR OLD.is_completed IS NULL) THEN
    
    -- Check if the process is sequential
    SELECT sp.is_sequential INTO is_process_sequential
    FROM stakeholders s
    JOIN stakeholder_processes sp ON s.process_id = sp.id
    WHERE s.id = NEW.stakeholder_id;
    
    -- Only auto-update current step for sequential processes
    IF is_process_sequential THEN
      -- Get the order of the just-completed step
      SELECT step_order + 1 INTO next_step_order
      FROM stakeholder_process_steps
      WHERE id = NEW.step_id;
      
      -- Find the next step
      SELECT sps.id INTO next_step
      FROM stakeholder_process_steps sps
      JOIN stakeholders s ON s.process_id = sps.process_id
      WHERE s.id = NEW.stakeholder_id
        AND sps.step_order = next_step_order
      LIMIT 1;
      
      -- Update stakeholder's current step
      IF next_step IS NOT NULL THEN
        UPDATE stakeholders
        SET 
          current_step_id = next_step,
          current_step_order = next_step_order
        WHERE id = NEW.stakeholder_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_current_step
  AFTER UPDATE OF is_completed ON stakeholder_step_data
  FOR EACH ROW
  EXECUTE FUNCTION update_current_step();

-- ==============================================================================
-- PART 6: UPDATE PERMISSIONS TABLE
-- ==============================================================================

-- Remove old stakeholders permission and add new ones
DELETE FROM permissions WHERE module_name = 'stakeholders';

-- Insert new permission modules
INSERT INTO permissions (module_name, display_name, description, category) VALUES
  ('stakeholder_processes', 'Stakeholder Processes', 'Manage stakeholder process definitions and steps', 'admin'),
  ('stakeholders', 'Stakeholders & Leads', 'Manage stakeholders and lead data', 'services')
ON CONFLICT (module_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- ==============================================================================
-- PART 7: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 7.1 Stakeholder Processes RLS
ALTER TABLE stakeholder_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company processes" ON stakeholder_processes
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage processes" ON stakeholder_processes
  FOR ALL
  USING (
    has_permission(auth.uid(), 'stakeholder_processes', 'can_write')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- 7.2 Stakeholder Process Steps RLS
ALTER TABLE stakeholder_process_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view process steps" ON stakeholder_process_steps
  FOR SELECT
  USING (
    process_id IN (
      SELECT id FROM stakeholder_processes 
      WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage process steps" ON stakeholder_process_steps
  FOR ALL
  USING (
    has_permission(auth.uid(), 'stakeholder_processes', 'can_write')
    AND process_id IN (
      SELECT id FROM stakeholder_processes 
      WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
      )
    )
  );

-- 7.3 Stakeholders RLS
ALTER TABLE stakeholders ENABLE ROW LEVEL SECURITY;

-- Everyone with stakeholder permission can read all stakeholders
CREATE POLICY "Users can view stakeholders" ON stakeholders
  FOR SELECT
  USING (
    has_permission(auth.uid(), 'stakeholders', 'can_read')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Users with write permission can create stakeholders
CREATE POLICY "Users can create stakeholders" ON stakeholders
  FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'stakeholders', 'can_write')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Users with write permission can update stakeholders
CREATE POLICY "Users can update stakeholders" ON stakeholders
  FOR UPDATE
  USING (
    has_permission(auth.uid(), 'stakeholders', 'can_write')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- Users with delete permission can delete stakeholders
CREATE POLICY "Users can delete stakeholders" ON stakeholders
  FOR DELETE
  USING (
    has_permission(auth.uid(), 'stakeholders', 'can_delete')
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()
    )
  );

-- 7.4 Stakeholder Step Data RLS
ALTER TABLE stakeholder_step_data ENABLE ROW LEVEL SECURITY;

-- Everyone with stakeholder permission can read all step data
CREATE POLICY "Users can view all step data" ON stakeholder_step_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stakeholders s
      WHERE s.id = stakeholder_step_data.stakeholder_id
        AND s.company_id IN (
          SELECT company_id FROM employees WHERE id = auth.uid()
        )
        AND has_permission(auth.uid(), 'stakeholders', 'can_read')
    )
  );

-- Users can write step data if:
-- 1. They have stakeholder write permission AND
-- 2. They are part of the team assigned to that step OR have full write access
CREATE POLICY "Team members can write their step data" ON stakeholder_step_data
  FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'stakeholders', 'can_read')
    AND (
      -- Member of team assigned to this step
      EXISTS (
        SELECT 1 
        FROM stakeholder_process_steps sps
        JOIN team_members tm ON tm.team_id = sps.team_id
        WHERE sps.id = stakeholder_step_data.step_id
          AND tm.employee_id = auth.uid()
      )
      -- OR has full write permission
      OR has_permission(auth.uid(), 'stakeholders', 'can_write')
    )
  );

CREATE POLICY "Team members can update their step data" ON stakeholder_step_data
  FOR UPDATE
  USING (
    has_permission(auth.uid(), 'stakeholders', 'can_read')
    AND (
      -- Member of team assigned to this step
      EXISTS (
        SELECT 1 
        FROM stakeholder_process_steps sps
        JOIN team_members tm ON tm.team_id = sps.team_id
        WHERE sps.id = stakeholder_step_data.step_id
          AND tm.employee_id = auth.uid()
      )
      -- OR has full write permission
      OR has_permission(auth.uid(), 'stakeholders', 'can_write')
    )
  );

-- Delete requires full delete permission
CREATE POLICY "Admins can delete step data" ON stakeholder_step_data
  FOR DELETE
  USING (
    has_permission(auth.uid(), 'stakeholders', 'can_delete')
  );

-- ==============================================================================
-- PART 8: SAMPLE DATA (Optional - for testing)
-- ==============================================================================

-- Uncomment below to insert sample process for company_id = 1
/*
-- Sample Process
INSERT INTO stakeholder_processes (name, description, company_id, is_sequential, allow_rollback, created_by) 
VALUES (
  'Client Onboarding Process',
  'Standard process for onboarding new clients',
  1,
  TRUE,
  FALSE,
  (SELECT id FROM employees WHERE company_id = 1 LIMIT 1)
) RETURNING id;

-- Sample Steps (assuming process_id = 1 and some team_ids exist)
INSERT INTO stakeholder_process_steps (process_id, name, description, step_order, team_id, field_definitions, use_date_range) VALUES
(
  1,
  'Initial Contact',
  'Capture initial contact information',
  1,
  (SELECT id FROM teams WHERE company_id = 1 LIMIT 1),
  '{"fields": [
    {"key": "initial_contact_date", "label": "Initial Contact Date", "type": "date", "required": true},
    {"key": "contact_method", "label": "Contact Method", "type": "text", "required": true},
    {"key": "notes", "label": "Notes", "type": "text", "required": false}
  ]}',
  FALSE
),
(
  1,
  'Requirement Gathering',
  'Document client requirements',
  2,
  (SELECT id FROM teams WHERE company_id = 1 LIMIT 1),
  '{"fields": [
    {"key": "requirements_doc", "label": "Requirements Document", "type": "file", "required": true},
    {"key": "budget_confirmed", "label": "Budget Confirmed", "type": "boolean", "required": true},
    {"key": "timeline", "label": "Expected Timeline", "type": "text", "required": false}
  ]}',
  FALSE
),
(
  1,
  'Contract Signing',
  'Final contract and agreement',
  3,
  (SELECT id FROM teams WHERE company_id = 1 LIMIT 1),
  '{"fields": [
    {"key": "contract_file", "label": "Signed Contract", "type": "file", "required": true},
    {"key": "signing_date", "label": "Signing Date", "type": "date", "required": true},
    {"key": "contract_value", "label": "Contract Value", "type": "text", "required": true}
  ]}',
  FALSE
);
*/

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

COMMENT ON TABLE stakeholder_processes IS 'Defines workflow processes that stakeholders follow';
COMMENT ON TABLE stakeholder_process_steps IS 'Individual steps within a stakeholder process';
COMMENT ON TABLE stakeholders IS 'Main stakeholder entity - called Lead until all steps completed';
COMMENT ON TABLE stakeholder_step_data IS 'Actual data entered for each step of each stakeholder';
