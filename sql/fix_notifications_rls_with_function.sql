-- ==============================================================================
-- NOTIFICATIONS RLS WITH SECURITY DEFINER FUNCTION
-- ==============================================================================
-- Uses security definer function to bypass employees table RLS
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

-- ==============================================================================
-- CREATE SECURITY DEFINER FUNCTION
-- ==============================================================================

-- Function to get user's company_id without RLS restrictions
CREATE OR REPLACE FUNCTION get_user_company_id(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_company_id INTEGER;
BEGIN
  SELECT company_id INTO user_company_id
  FROM employees
  WHERE id = user_id;
  
  RETURN user_company_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_user_company_id(UUID) TO authenticated;

-- ==============================================================================
-- ENABLE RLS
-- ==============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- CREATE POLICIES USING SECURITY DEFINER FUNCTION
-- ==============================================================================

-- SELECT: Users can read their own notifications
CREATE POLICY "notifications_select_policy"
  ON notifications
  FOR SELECT
  USING (
    recipient_id = auth.uid()
  );

-- INSERT: Users can create notifications for their company
CREATE POLICY "notifications_insert_policy"
  ON notifications
  FOR INSERT
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
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

-- Test the security definer function
SELECT get_user_company_id(auth.uid()) as my_company_id;

-- List all policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'notifications' 
ORDER BY cmd;

-- List functions
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname = 'get_user_company_id';
