-- Fix RLS Policy for Real-time Notifications
-- Run this if you're getting CHANNEL_ERROR despite real-time being enabled

-- First, check current policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications' AND cmd = 'SELECT';

-- Drop the problematic policy if it exists
DROP POLICY IF EXISTS "Users can subscribe to their own notifications" ON notifications;

-- Create a simpler, working policy for real-time
CREATE POLICY "Enable real-time for own notifications"
  ON notifications
  FOR SELECT
  USING (
    recipient_id = auth.uid()::text
  );

-- Verify you can select your notifications
SELECT COUNT(*) as my_notification_count
FROM notifications 
WHERE recipient_id = auth.uid()::text;

-- Check real-time is enabled
SELECT 
    'notifications' IN (
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
    ) as is_enabled;
