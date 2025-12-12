-- ==============================================================================
-- ENABLE REAL-TIME NOTIFICATIONS
-- ==============================================================================
-- This script enables real-time functionality for the notifications table
-- Replaces polling with Supabase real-time subscriptions
-- ==============================================================================

-- Enable real-time for the notifications table
-- This allows clients to subscribe to changes (INSERT, UPDATE, DELETE)
ALTER publication supabase_realtime ADD TABLE notifications;

-- Verify the table is added to the publication
-- Run this to check: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Create RLS policy for real-time subscriptions
-- Users can only receive real-time updates for their own notifications
CREATE POLICY "Users can subscribe to their own notifications"
  ON notifications
  FOR SELECT
  USING (
    recipient_id = auth.uid()::text
    AND company_id IN (
      SELECT company_id 
      FROM employees 
      WHERE id = auth.uid()::text
    )
  );

-- Grant necessary permissions for real-time
-- authenticated users need to be able to SELECT their notifications for real-time to work
GRANT SELECT ON notifications TO authenticated;

-- Create indexes optimized for real-time queries (already exist but confirming)
-- These indexes ensure real-time subscriptions perform well

-- Index for recipient + company filtering (primary real-time query)
CREATE INDEX IF NOT EXISTS idx_notifications_realtime_recipient 
ON notifications (recipient_id, company_id, created_at DESC);

-- Index for unread notifications (for badge counts)
CREATE INDEX IF NOT EXISTS idx_notifications_realtime_unread 
ON notifications (recipient_id, company_id, is_read) 
WHERE is_read = false;

COMMENT ON TABLE notifications IS 'Notifications table with real-time subscriptions enabled. Clients should subscribe to changes filtered by recipient_id and company_id.';
