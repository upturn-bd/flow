-- Add linked_fields column to stakeholder_issues table
-- This column stores field-level linking data as JSONB
-- Format: [{ stepDataId: number, fieldKey: string, stepName?: string, stepOrder?: number, fieldLabel?: string }]

ALTER TABLE stakeholder_issues
ADD COLUMN IF NOT EXISTS linked_fields JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN stakeholder_issues.linked_fields IS 'Array of linked step fields with format: [{stepDataId, fieldKey, stepName?, stepOrder?, fieldLabel?}]';

-- Create an index for better query performance when filtering by linked fields
CREATE INDEX IF NOT EXISTS idx_stakeholder_issues_linked_fields 
ON stakeholder_issues USING GIN (linked_fields);
