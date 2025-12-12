# Real-time Notifications Implementation

## Overview

This document describes the implementation of real-time notifications in the Flow HRIS system using Supabase's real-time functionality. The polling mechanism has been completely replaced with WebSocket-based real-time subscriptions.

## Architecture Changes

### Before (Polling-based)
- **Top Bar**: Polled every 30 seconds using `setInterval`
- **Notification Dropdown**: Fetched notifications on open
- **High overhead**: Multiple requests every 30 seconds per user
- **Delayed updates**: Up to 30-second delay for new notifications

### After (Real-time)
- **WebSocket Connection**: Single persistent connection per user
- **Instant Updates**: Notifications appear immediately when created
- **Low overhead**: No polling, only initial fetch + real-time events
- **Better UX**: Live updates across all components

## Files Modified

### 1. SQL Migration (`sql/enable_realtime_notifications.sql`)
**Purpose**: Enable real-time replication and set up proper RLS policies

**Key Changes**:
```sql
-- Enable real-time for notifications table
ALTER publication supabase_realtime ADD TABLE notifications;

-- RLS policy for real-time subscriptions
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
```

**Run this migration**:
```bash
# Connect to your Supabase database and run:
psql <your-database-url> -f sql/enable_realtime_notifications.sql
```

### 2. Notifications Hook (`src/hooks/useNotifications.tsx`)
**Purpose**: Centralized notification management with real-time subscriptions

**Key Additions**:
- Added `useEffect` hook that subscribes to real-time changes
- Listens for `INSERT`, `UPDATE`, and `DELETE` events
- Maintains local state (`notifications`, `unreadCount`) updated by real-time events
- Automatic cleanup on unmount

**Real-time Subscription Logic**:
```typescript
const channel = supabase
  .channel(`notifications:${userId}:${companyId}`)
  .on('postgres_changes', {
    event: '*', // All events
    schema: 'public',
    table: 'notifications',
    filter: `recipient_id=eq.${userId}`,
  }, async (payload) => {
    if (payload.eventType === 'INSERT') {
      // Add new notification to state
    } else if (payload.eventType === 'UPDATE') {
      // Update existing notification
    } else if (payload.eventType === 'DELETE') {
      // Remove notification from state
    }
  })
  .subscribe();
```

**Benefits**:
- Single source of truth for notifications across the app
- Automatic state management
- Type-safe with proper TypeScript types

### 3. Top Bar (`src/app/(home)/top-bar.tsx`)
**Purpose**: Display notification badge and handle new notification alerts

**Changes**:
- ❌ **Removed**: `setInterval` polling (line 118)
- ❌ **Removed**: `checkForNewNotifications` function
- ✅ **Added**: Direct use of `notifications` from hook
- ✅ **Added**: Effect to watch for new notifications in real-time state

**New Logic**:
```typescript
// Get notifications from real-time hook
const { notifications, unreadCount, fetchUnreadCount } = useNotifications();

// Watch for new notifications
useEffect(() => {
  if (notifications.length > 0 && previousUnreadCount > 0) {
    const currentUnreadCount = notifications.filter(n => !n.is_read).length;
    
    if (currentUnreadCount > previousUnreadCount) {
      // Show new notification modal
      const newestUnread = notifications.find(n => !n.is_read);
      if (newestUnread) {
        setLatestNotification(newestUnread);
        setNewNotificationModal(true);
      }
    }
  }
}, [notifications, previousUnreadCount]);
```

### 4. Notification Dropdown (`src/components/notifications/NotificationDropdown.tsx`)
**Purpose**: Display list of notifications in dropdown

**Changes**:
- ❌ **Removed**: Local `notifications` state
- ❌ **Removed**: `loadNotifications` function
- ❌ **Removed**: Manual state updates in handlers
- ✅ **Updated**: Uses `notifications` directly from hook
- ✅ **Simplified**: Handlers just call API, real-time updates state

**Simplified Handlers**:
```typescript
const handleMarkAsRead = async (notificationId: number) => {
  await markAsRead(notificationId);
  // Real-time subscription will update the state automatically
};
```

## How It Works

### Flow of Events

1. **Subscription Setup** (on component mount)
   ```
   User logs in → useNotifications hook initializes
   → Creates channel `notifications:{userId}:{companyId}`
   → Subscribes to postgres_changes on notifications table
   → Performs initial fetch of notifications
   ```

2. **New Notification Created** (real-time flow)
   ```
   Backend creates notification → Database INSERT
   → Supabase real-time broadcasts event
   → All subscribed clients receive event instantly
   → Hook updates local state (adds to notifications array)
   → UI re-renders automatically (React state update)
   → Badge count updates
   → Dropdown shows new notification
   → Top bar shows notification modal
   ```

3. **Notification Marked as Read**
   ```
   User clicks "Mark as Read" → API call to update database
   → Database UPDATE
   → Supabase broadcasts UPDATE event
   → Hook updates notification in state
   → UI re-renders with updated notification
   → Badge count decrements
   ```

4. **Cleanup** (on component unmount)
   ```
   Component unmounts → useEffect cleanup runs
   → Removes channel subscription
   → Closes WebSocket connection
   ```

## Performance Benefits

### Before (Polling)
- **Network Requests**: 1 request every 30 seconds × number of users
- **Example**: 100 users = 200 requests/minute = 12,000 requests/hour
- **Database Load**: Constant SELECT queries
- **Latency**: Up to 30-second delay for updates

### After (Real-time)
- **Network Requests**: 1 initial fetch per user
- **Example**: 100 users = 100 initial requests + WebSocket events
- **Database Load**: Minimal - only on actual changes
- **Latency**: <100ms for updates (near-instant)

### Bandwidth Savings
- **Polling**: ~100KB per request × 12,000/hour = ~1.2GB/hour
- **Real-time**: ~50KB initial + ~1KB per event = ~50KB + events

## Configuration

### Supabase Dashboard Settings

1. **Enable Real-time** (if not already enabled)
   - Go to Database → Replication
   - Ensure `notifications` table is in the publication

2. **Verify RLS Policies**
   - Ensure users can only SELECT their own notifications
   - Policies must allow real-time subscriptions

### Environment Variables
No new environment variables needed - uses existing Supabase configuration.

## Testing

### Manual Testing Checklist

1. **Real-time Updates**
   - [ ] Open app in two browser windows with same user
   - [ ] Create notification in one window
   - [ ] Verify notification appears in other window instantly

2. **Badge Count**
   - [ ] Verify badge shows correct unread count
   - [ ] Mark notification as read
   - [ ] Verify badge count decrements

3. **Dropdown**
   - [ ] Open notification dropdown
   - [ ] Verify notifications load
   - [ ] Create new notification (in another window)
   - [ ] Verify new notification appears in dropdown

4. **New Notification Modal**
   - [ ] Create new notification
   - [ ] Verify modal pops up with notification details

5. **Cleanup**
   - [ ] Open developer console
   - [ ] Navigate away from page
   - [ ] Verify no subscription errors in console

### Automated Testing
```typescript
// Example test for real-time subscription
test('should receive new notification in real-time', async () => {
  const { result } = renderHook(() => useNotifications());
  
  // Wait for initial fetch
  await waitFor(() => expect(result.current.notifications).toBeDefined());
  
  const initialCount = result.current.notifications.length;
  
  // Simulate notification creation
  await supabase.from('notifications').insert({
    title: 'Test',
    message: 'Test message',
    recipient_id: 'user-id',
    company_id: 1,
  });
  
  // Verify notification received
  await waitFor(() => {
    expect(result.current.notifications.length).toBe(initialCount + 1);
  });
});
```

## Troubleshooting

### Notifications Not Appearing
1. Check browser console for subscription errors
2. Verify real-time is enabled in Supabase dashboard
3. Check RLS policies allow SELECT for current user
4. Verify `recipient_id` and `company_id` match current user

### Subscription Connection Issues
1. Check network tab for WebSocket connection
2. Verify Supabase URL and anon key are correct
3. Check for CORS issues
4. Try refreshing the page

### Console Logs
The implementation includes debug logs:
```
Real-time notification event: { eventType: 'INSERT', ... }
Notification subscription status: 'SUBSCRIBED'
```

Enable in browser console to debug issues.

## Future Enhancements

1. **Notification Grouping**: Group similar notifications
2. **Notification Sounds**: Play sound on new notification
3. **Desktop Notifications**: Browser push notifications
4. **Read Receipts**: Track when notifications were seen
5. **Notification Preferences**: Let users customize notification types
6. **Offline Support**: Queue notifications when offline

## Migration Guide

If you have existing polling code elsewhere in the app:

1. Import `useNotifications` hook
2. Remove `setInterval` or polling logic
3. Use `notifications` state from hook
4. Let real-time handle updates automatically

Example:
```typescript
// Before
const [items, setItems] = useState([]);
useEffect(() => {
  const poll = setInterval(() => fetch(), 30000);
  return () => clearInterval(poll);
}, []);

// After
const { notifications } = useNotifications();
// That's it! Real-time handles updates
```

## References

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Real-time Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [PostgreSQL Listen/Notify](https://www.postgresql.org/docs/current/sql-notify.html)
