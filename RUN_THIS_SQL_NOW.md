# ⚠️ CRITICAL: Run This SQL Migration NOW

## The Problem

Your logs show:
```
[useNotifications] Notification subscription status: CHANNEL_ERROR
```

This means **real-time is NOT enabled** for the notifications table.

## The Solution

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar

### Step 2: Run This SQL

Copy and paste this into the SQL Editor and click **Run**:

```sql
-- Enable real-time for notifications table
ALTER publication supabase_realtime ADD TABLE notifications;

-- Create RLS policy for real-time
CREATE POLICY IF NOT EXISTS "Users can subscribe to their own notifications"
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

-- Grant SELECT permission
GRANT SELECT ON notifications TO authenticated;
```

### Step 3: Verify It Worked

Run this query to confirm:

```sql
SELECT 'notifications' IN (
    SELECT tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
) as is_enabled;
```

**Expected Result**: `is_enabled = true`

### Step 4: Refresh Your App

After running the SQL:
1. Go back to your app
2. **Hard refresh** (Ctrl+Shift+R)
3. Look for this in console:

```
[useNotifications] Notification subscription status: SUBSCRIBED  ✅
```

**NOT** `CHANNEL_ERROR` or `CLOSED`

### Step 5: Test

Create a notification and you should see real-time logs immediately!

---

## Alternative: Use Supabase Dashboard UI

If you prefer the UI:

1. Go to **Database → Replication**
2. Look for the **supabase_realtime** publication
3. Click to expand it
4. If **notifications** is not in the list, click **Add Table**
5. Select **notifications** table
6. Click **Save**

Then refresh your app!

---

## Why This is Required

Supabase real-time is **opt-in** per table. Until you add the table to the `supabase_realtime` publication, WebSocket subscriptions will fail with `CHANNEL_ERROR`.

**This is a ONE-TIME setup** - once done, it will work forever!
