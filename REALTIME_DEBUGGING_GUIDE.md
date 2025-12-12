# Real-time Notifications Debugging Guide

## Issue Reported
Real-time events are being received (visible in console), but notifications are not appearing in the UI.

## Enhanced Debugging Added

### Console Logs to Look For

When a new notification is created, you should see this sequence in the browser console:

```javascript
// 1. Real-time event received
Real-time notification event: { eventType: 'INSERT', new: {...}, ... }
Current notifications state length: X

// 2. Processing new notification
New notification received, ID: 1695

// 3. Fetching notification details (with type information)
Adding notification to state: { id: 1695, title: '...', type: {...}, ... }

// 4. Updating state
Previous notifications count: X
Updated notifications count: X+1
Unread count updated: Y -> Y+1

// 5. State change detected
Notifications state updated, count: X+1 [array of notifications]
```

## Troubleshooting Steps

### Step 1: Check Subscription Setup
Look for this log when the component mounts:
```
Setting up notification subscription for user: <userId> company: <companyId>
```

If you see:
```
Skipping notification subscription - missing companyId or userId
```
Then authentication or company info is not loaded yet.

### Step 2: Verify Real-time Event is Received
You should see:
```javascript
Real-time notification event: {
  eventType: "INSERT",
  new: { id: 1695, ... },
  schema: "public",
  table: "notifications"
}
```

✅ If you see this, real-time subscription is working correctly.

### Step 3: Check Notification Fetch
Look for:
```
New notification received, ID: <id>
Adding notification to state: {...}
```

❌ If you see an error here, the notification_types table might be missing data.

### Step 4: Verify State Update
You should see:
```
Previous notifications count: 5
Updated notifications count: 6
Notifications state updated, count: 6
```

❌ If counts don't increase, state update failed.

### Step 5: Check Component Re-render
The component using `useNotifications()` should re-render when notifications state changes.

## Common Issues & Solutions

### Issue 1: Notification Appears in Event but Not in State

**Symptom**: You see the event log but no "Adding notification to state" log.

**Cause**: Error fetching notification details with type information.

**Solution**: 
```sql
-- Check if notification_types table has data
SELECT * FROM notification_types;

-- If empty, add default types
INSERT INTO notification_types (name, description, icon, color)
VALUES 
  ('general', 'General notification', 'bell', 'blue'),
  ('task', 'Task notification', 'briefcase', 'purple'),
  ('alert', 'Alert notification', 'alert-circle', 'red');
```

### Issue 2: State Updates but UI Doesn't Refresh

**Symptom**: You see "Notifications state updated" but UI doesn't change.

**Cause**: Component not properly consuming the notifications array.

**Check**:
1. Component is using `notifications` from hook
2. Component has proper dependency array in useEffect
3. No memo/caching preventing re-render

### Issue 3: Duplicate Notifications

**Symptom**: Same notification appears multiple times.

**Cause**: Multiple subscriptions or channel not cleaned up.

**Solution**: Already handled with duplicate check:
```typescript
const exists = prev.some(n => n.id === data.id);
if (exists) {
  console.log('Notification already exists in state, skipping');
  return prev;
}
```

### Issue 4: Wrong User Receiving Notifications

**Symptom**: You see notifications meant for other users.

**Cause**: RLS policy not working or filter incorrect.

**Check**:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';
-- rowsecurity should be true

-- Test the filter
SELECT * FROM notifications 
WHERE recipient_id = '<your-user-id>';
```

## Testing Checklist

Run through these tests with console open:

1. **Basic Real-time**
   - [ ] Open app, check for "Setting up notification subscription" log
   - [ ] Create notification (use another window or admin panel)
   - [ ] Verify "Real-time notification event" log appears
   - [ ] Verify "Adding notification to state" log appears
   - [ ] Verify notification appears in UI

2. **State Management**
   - [ ] Check "Notifications state updated" shows correct count
   - [ ] Create multiple notifications
   - [ ] Verify count increments correctly
   - [ ] Check no duplicates in state

3. **Update/Delete**
   - [ ] Mark notification as read
   - [ ] Verify "Notification updated" log
   - [ ] Delete notification
   - [ ] Verify "Notification deleted" log
   - [ ] Check state count decreases

4. **Unread Badge**
   - [ ] Verify badge count matches unread notifications
   - [ ] Mark as read
   - [ ] Verify badge decrements
   - [ ] Mark all as read
   - [ ] Verify badge shows 0

## Real-time Subscription Status

The subscription can have these statuses:

```javascript
Notification subscription status: "SUBSCRIBED"    // ✅ Working
Notification subscription status: "CLOSED"        // ❌ Connection closed
Notification subscription status: "CHANNEL_ERROR" // ❌ Channel error
Notification subscription status: "TIMED_OUT"     // ❌ Connection timeout
```

If not "SUBSCRIBED", check:
1. Internet connection
2. Supabase project status
3. Real-time enabled in Supabase dashboard
4. RLS policies allow SELECT

## Advanced Debugging

### Enable Verbose Logging

Add to the subscription setup:
```typescript
const channel = supabase
  .channel(`notifications:${userId}:${companyId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: userId },
    }
  })
  .on('*', '*', (payload) => {
    console.log('All channel events:', payload);
  })
  // ... rest of setup
```

### Check WebSocket Connection

1. Open Chrome DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to Supabase realtime
4. Check connection status (should be green "101 Switching Protocols")

### Inspect Real-time Messages

Click on the WebSocket connection in Network tab, then Messages tab to see all real-time messages being sent/received.

## Quick Fix Checklist

If notifications still not working after checking logs:

1. **Hard Refresh**: Ctrl+Shift+R (clears component cache)
2. **Check Auth**: User logged in and `employeeInfo` loaded?
3. **Run SQL**: Execute `sql/verify_realtime_setup.sql` in Supabase
4. **Restart Channel**: Close and reopen the app
5. **Check Errors**: Look for any red errors in console

## Need More Help?

With the enhanced logging, share these details:

1. Full console logs from when notification is created
2. Network tab WebSocket connection status
3. Result of `sql/verify_realtime_setup.sql`
4. Browser and version
5. Any error messages

The detailed logs will show exactly where the flow breaks!
