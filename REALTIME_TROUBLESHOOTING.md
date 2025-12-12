# Real-time Not Working - Troubleshooting Steps

## Problem
Creating a notification but **no console logs appear** (no real-time event received).

## Root Cause Analysis

When you see **only** the "Creating task" log but none of the real-time logs, it means:
1. The real-time subscription was never created, OR
2. The SQL migration wasn't run, OR
3. The subscription disconnected

## Step-by-Step Fix

### Step 1: Check Browser Console on Page Load

**Refresh the page** and look for these logs:

```javascript
✅ Should see:
[useNotifications] Setting up notification subscription for user: <userId> company: <companyId>
[useNotifications] Initial fetch complete: X notifications, Y unread
[useNotifications] Creating channel: notifications:<userId>:<companyId>
[useNotifications] Notification subscription status: "SUBSCRIBED"
[TopBar] Notifications updated: X unread: Y

❌ If you DON'T see these, subscription isn't being created
```

**If you don't see ANY of these logs:**
- Check if `employeeInfo` is loaded (add `console.log('employeeInfo:', employeeInfo)` to see)
- Check if user is authenticated

### Step 2: Verify SQL Migration Was Run

Open **Supabase Dashboard → SQL Editor** and run this query:

```sql
SELECT 'notifications' IN (
    SELECT tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
) as is_realtime_enabled;
```

**Expected Result**: `is_realtime_enabled = true`

**If `false`**: The migration wasn't run. Run this:

```sql
ALTER publication supabase_realtime ADD TABLE notifications;
```

### Step 3: Check Real-time in Supabase Dashboard

1. Go to **Supabase Dashboard**
2. Navigate to **Database → Replication**
3. Look for `notifications` table in the list
4. If not there, click **Add Table** and select `notifications`

### Step 4: Verify RLS Policies

Run this query in SQL Editor:

```sql
SELECT * FROM notifications 
WHERE recipient_id = auth.uid()::text
LIMIT 5;
```

**Expected**: Should return your notifications without error

**If error**: RLS policies are blocking. Run the full migration script:
```sql
-- From sql/enable_realtime_notifications.sql
CREATE POLICY "Users can subscribe to their own notifications"
  ON notifications FOR SELECT
  USING (
    recipient_id = auth.uid()::text
    AND company_id IN (
      SELECT company_id FROM employees WHERE id = auth.uid()::text
    )
  );

GRANT SELECT ON notifications TO authenticated;
```

### Step 5: Check WebSocket Connection

1. Open **Chrome DevTools → Network tab**
2. Filter by **WS** (WebSocket)
3. Refresh the page
4. Look for a WebSocket connection to Supabase

**Should see**:
- Connection status: **101 Switching Protocols** (green)
- Status: **Connected**

**If no WebSocket connection**:
- Real-time might not be enabled in Supabase project
- Check Supabase project settings

### Step 6: Force Subscription Recreate

Add this to the top of your component to force a refresh:

```typescript
// In top-bar.tsx or any component
useEffect(() => {
  console.log('Component mounted, employeeInfo:', employeeInfo);
}, [employeeInfo]);
```

Then:
1. Hard refresh (Ctrl+Shift+R)
2. Check console for the log
3. Verify `employeeInfo` has `id` and `company_id`

## Quick Test After Fixes

After running the SQL migration and refreshing:

1. **Open console**
2. **Refresh page** (Ctrl+Shift+R)
3. **Look for**: `[useNotifications] Notification subscription status: "SUBSCRIBED"`
4. **Create test notification**
5. **Should see**: Real-time logs immediately

## Common Issues

### Issue 1: Subscription Status is "CLOSED" or "CHANNEL_ERROR"

**Cause**: Real-time not enabled for table or RLS blocking

**Fix**:
```sql
-- Enable real-time
ALTER publication supabase_realtime ADD TABLE notifications;

-- Grant SELECT permission
GRANT SELECT ON notifications TO authenticated;
```

### Issue 2: No Subscription Logs at All

**Cause**: `employeeInfo` not loaded when useEffect runs

**Fix**: Add loading check
```typescript
if (!employeeInfo?.id || !employeeInfo?.company_id) {
  console.log('Waiting for employeeInfo...');
  return <div>Loading...</div>;
}
```

### Issue 3: Subscription Created but No Events

**Cause**: Filter might be wrong or notifications not matching

**Test**: Create notification with exact recipient_id
```sql
-- Check what your user ID is
SELECT auth.uid()::text as my_user_id;

-- Create test notification
INSERT INTO notifications (
  title, message, recipient_id, company_id, is_read
) VALUES (
  'Test', 'Test message', 
  '<your-user-id>',  -- Use the ID from above
  1,                 -- Your company_id
  false
);
```

## The Fix I Just Applied

I fixed a critical issue in the code:

**Problem**: The useEffect had `fetchUserNotifications` and `fetchUnreadCount` in dependencies, causing the subscription to recreate constantly.

**Solution**: 
1. Removed those dependencies
2. Moved initial fetch inline to avoid dependency issues
3. Added comprehensive logging with `[useNotifications]` prefix

**Now refresh and you should see**:
```
[useNotifications] Setting up notification subscription for user: ...
[useNotifications] Initial fetch complete: ...
[useNotifications] Creating channel: ...
[useNotifications] Notification subscription status: "SUBSCRIBED"
```

## Next Steps

1. **Hard refresh** your browser (Ctrl+Shift+R)
2. **Check console** for subscription logs
3. **If still no logs**: Run `sql/test_realtime_enabled.sql` in Supabase
4. **Create test notification**
5. **Share console output** - the new logs will pinpoint the issue

The enhanced logging will show exactly where the setup is failing!
