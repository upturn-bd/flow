-- Verification Script for Real-time Notifications
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- ============================================================================
-- 1. Check if notifications table exists and has real-time enabled
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    tablename IN (
        SELECT tablename 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime'
    ) as "is_realtime_enabled"
FROM pg_tables 
WHERE tablename = 'notifications';

-- Expected: is_realtime_enabled = true


-- ============================================================================
-- 2. Verify RLS policies exist for notifications
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Expected: Should see policies including "Users can subscribe to their own notifications"


-- ============================================================================
-- 3. Check indexes for performance
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'notifications'
ORDER BY indexname;

-- Expected: Should see indexes like idx_notifications_realtime_recipient, idx_notifications_realtime_unread


-- ============================================================================
-- 4. Verify table structure
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Expected: Should see all notification columns including recipient_id, company_id, is_read, etc.


-- ============================================================================
-- 5. Check real-time publication configuration
-- ============================================================================
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Expected: Should exist and have notifications table


-- ============================================================================
-- 6. List all tables in real-time publication
-- ============================================================================
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- Expected: notifications should be in the list


-- ============================================================================
-- 7. Test notification creation (optional - creates test notification)
-- ============================================================================
-- UNCOMMENT BELOW TO CREATE A TEST NOTIFICATION
/*
-- Replace 'your-user-id' and company-id with actual values
INSERT INTO notifications (
    title,
    message,
    recipient_id,
    company_id,
    priority,
    context,
    is_read
) VALUES (
    'Test Real-time Notification',
    'This is a test notification to verify real-time is working',
    'your-user-id',  -- Replace with actual user ID
    1,               -- Replace with actual company ID
    'normal',
    'test',
    false
) RETURNING *;
*/


-- ============================================================================
-- 8. Check recent notifications (to verify test)
-- ============================================================================
SELECT 
    id,
    title,
    message,
    recipient_id,
    company_id,
    priority,
    is_read,
    created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;


-- ============================================================================
-- 9. Count notifications by status
-- ============================================================================
SELECT 
    is_read,
    COUNT(*) as notification_count,
    COUNT(DISTINCT recipient_id) as unique_recipients
FROM notifications 
GROUP BY is_read;


-- ============================================================================
-- 10. Performance check - index usage
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "times_used",
    idx_tup_read as "tuples_read",
    idx_tup_fetch as "tuples_fetched"
FROM pg_stat_user_indexes 
WHERE tablename = 'notifications'
ORDER BY idx_scan DESC;

-- Higher idx_scan values indicate the index is being used effectively


-- ============================================================================
-- VERIFICATION CHECKLIST
-- ============================================================================
-- [ ] notifications table exists
-- [ ] is_realtime_enabled = true
-- [ ] RLS policies exist for SELECT
-- [ ] Required indexes exist (realtime_recipient, realtime_unread)
-- [ ] Real-time publication includes notifications table
-- [ ] Test notification can be created (if run)
-- [ ] Indexes are being used (check idx_scan > 0)
-- 
-- If all checks pass, real-time notifications are properly configured! ✓
