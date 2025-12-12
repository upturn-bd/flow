-- Quick Test: Check if Real-time is Enabled for Notifications
-- Run this in Supabase SQL Editor to verify setup

-- 1. Check if notifications table is in the real-time publication
SELECT 
    'notifications' IN (
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
    ) as is_realtime_enabled;

-- Expected Result: is_realtime_enabled = true
-- If false, run: ALTER publication supabase_realtime ADD TABLE notifications;


-- 2. Check RLS policies for notifications
SELECT COUNT(*) as rls_policy_count
FROM pg_policies 
WHERE tablename = 'notifications';

-- Expected Result: Should have multiple policies (at least 1)


-- 3. Test if you can select notifications (RLS check)
SELECT COUNT(*) as my_notifications_count
FROM notifications 
WHERE recipient_id = auth.uid()::text;

-- Expected Result: Should return your notification count without error
-- If error, RLS policies might be blocking access


-- 4. Check if real-time publication exists
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Expected Result: Should return one row


-- 5. List all tables in real-time publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Expected Result: 'notifications' should be in the list
