-- Enable real-time subscriptions for task_records table
-- This migration enables Supabase real-time functionality for the task_records table

-- 1. Add task_records table to the real-time publication
-- This allows clients to subscribe to INSERT, UPDATE, and DELETE events
ALTER publication supabase_realtime ADD TABLE task_records;

-- 2. Verify RLS is enabled (should already be enabled)
-- Real-time subscriptions respect RLS policies
ALTER TABLE task_records ENABLE ROW LEVEL SECURITY;

-- 3. Create optimized RLS policy for real-time subscriptions
-- Replace existing select policy with a simpler one for better real-time performance
DROP POLICY IF EXISTS "Users can view tasks in their company" ON task_records;

CREATE POLICY "Users can view tasks in their company"
ON task_records
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM employees 
    WHERE id = auth.uid()
  )
);

-- 4. Create indexes to optimize real-time queries
-- These indexes improve performance when filtering tasks by different scopes

-- Index for user-scoped tasks (tasks assigned to specific user)
CREATE INDEX IF NOT EXISTS idx_task_records_assignees_gin 
ON task_records USING gin(assignees);

-- Index for project-scoped tasks
CREATE INDEX IF NOT EXISTS idx_task_records_project_id 
ON task_records(project_id) 
WHERE project_id IS NOT NULL;

-- Index for milestone-scoped tasks
CREATE INDEX IF NOT EXISTS idx_task_records_milestone_id 
ON task_records(milestone_id) 
WHERE milestone_id IS NOT NULL;

-- Index for department-scoped tasks
CREATE INDEX IF NOT EXISTS idx_task_records_department_id 
ON task_records(department_id) 
WHERE department_id IS NOT NULL;

-- Index for company-scoped tasks (all tasks in company)
CREATE INDEX IF NOT EXISTS idx_task_records_company_id 
ON task_records(company_id);

-- Composite index for status filtering
CREATE INDEX IF NOT EXISTS idx_task_records_status_company 
ON task_records(status, company_id);

-- Index for created_by (useful for "my created tasks" queries)
CREATE INDEX IF NOT EXISTS idx_task_records_created_by 
ON task_records(created_by);

-- 5. Grant necessary permissions
-- Ensure authenticated users can subscribe to task_records changes
GRANT SELECT ON task_records TO authenticated;

-- 6. Verify real-time is enabled
-- Run this to confirm task_records is in the publication:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- NOTES:
-- - After running this migration, clients can subscribe to task_records changes
-- - Subscriptions will automatically filter based on RLS policies
-- - Real-time events will only be sent for tasks the user has permission to see
-- - The indexes ensure efficient filtering for all TaskScope types (USER, PROJECT, MILESTONE, COMPANY, DEPARTMENT)
