-- ==============================================================================
-- ULTRA SIMPLE NOTIFICATIONS RLS POLICY
-- ==============================================================================
-- Most permissive approach - just validate user belongs to the company
-- ==============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can subscribe to their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable real-time for own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications in their company" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Allow notification creation" ON notifications;
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON notifications;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ULTRA SIMPLE POLICIES
-- ==============================================================================

-- SELECT: Users can read their own notifications
CREATE POLICY "notifications_select_policy"
  ON notifications
  FOR SELECT
  USING (
    recipient_id = auth.uid()
  );

-- INSERT: Any authenticated user in the company can create notifications
-- Ultra simple - just verify the notification's company matches user's company
CREATE POLICY "notifications_insert_policy"
  ON notifications
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM employees 
      WHERE id = auth.uid()
    )
  );

-- UPDATE: Users can update their own notifications
CREATE POLICY "notifications_update_policy"
  ON notifications
  FOR UPDATE
  USING (
    recipient_id = auth.uid()
  );

-- DELETE: Users can delete their own notifications
CREATE POLICY "notifications_delete_policy"
  ON notifications
  FOR DELETE
  USING (
    recipient_id = auth.uid()
  );

-- ==============================================================================
-- GRANT PERMISSIONS
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT ON employees TO authenticated;  -- Ensure policy can read employees table

-- ==============================================================================
-- ENABLE REALTIME
-- ==============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ==============================================================================
-- VERIFY
-- ==============================================================================

-- Check current user's company
SELECT id, company_id FROM employees WHERE id = auth.uid();

-- List all policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications' 
ORDER BY cmd;

-- Test if you can see the employees table (needed for policy)
SELECT COUNT(*) as employee_count FROM employees LIMIT 1;
