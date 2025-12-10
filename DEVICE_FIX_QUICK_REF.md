# Device Recognition - Quick Fix Reference

## What Was Wrong?

### 🔴 Critical Issue: UAParser v2.x Compatibility
The `ua-parser-js` library was upgraded to v2.0.7, but the code was still using v1.x syntax.

**Error in Console:**
```
TypeError: UAParser is not a constructor
// or
This expression is not callable
```

## The Fix

### ✅ File: `src/lib/utils/device.ts`
```typescript
// ❌ BEFORE (Broken):
import { UAParser } from 'ua-parser-js';
const parser = new UAParser();

// ✅ AFTER (Fixed):
import UAParser from 'ua-parser-js';
const parser = new (UAParser as any)(userAgent);
const result = parser.getResult();
```

### ✅ File: `sql/update_device_info.sql`
Added missing `model` column:
```sql
ALTER TABLE user_devices 
ADD COLUMN IF NOT EXISTS model TEXT;
```

## Test It Works

### 1. Clear Browser Storage
```javascript
// In browser console:
localStorage.clear();
```

### 2. Test Device Detection
```javascript
// In browser console:
import { getDeviceDetails } from '@/lib/utils/device';
console.log(getDeviceDetails());

// Should output:
// {
//   browser: "Chrome 120.0.6099.130",
//   os: "Windows 11",
//   device_type: "desktop",
//   model: "Unknown Device",
//   user_agent: "Mozilla/5.0...",
//   device_info: "Chrome on Windows"
// }
```

### 3. Login Test
1. Go to `/login`
2. Enter valid credentials
3. Check browser console - no errors
4. Should redirect to device approval page (new device)
5. Check `user_devices` table - should have new record

### 4. Verify Database
```sql
SELECT 
  device_id,
  device_info,
  browser,
  os,
  device_type,
  model,
  user_agent,
  status
FROM user_devices
ORDER BY created_at DESC
LIMIT 1;
```

All fields should be populated (except `location` which needs additional API).

## Still Not Working?

### Debug Steps:

**1. Check Package Version:**
```bash
npm list ua-parser-js
# Should show: ua-parser-js@2.0.7
```

**2. Check Database Migration:**
```sql
-- Run this to add columns if missing:
ALTER TABLE user_devices 
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS browser TEXT,
ADD COLUMN IF NOT EXISTS os TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;
```

**3. Check Browser Console:**
- Open DevTools (F12)
- Go to Console tab
- Look for red errors during login
- Common errors:
  - "UAParser is not defined" → Import issue
  - "Cannot read property 'name'" → Optional chaining needed
  - Database errors → Migration not run

**4. Test UAParser Directly:**
```javascript
// In browser console:
import('ua-parser-js').then(UAParser => {
  const parser = new (UAParser.default as any)(navigator.userAgent);
  console.log('Test:', parser.getResult());
});
```

## What Each File Does

### `src/lib/utils/device.ts`
- **getDeviceId()**: Creates/retrieves unique device ID from localStorage
- **getDeviceDetails()**: Parses user agent to extract device info
- **getDeviceInfo()**: Returns human-readable summary

### `src/app/(auth)/auth-actions.ts`
- Handles login with device check
- Inserts new devices as 'pending'
- Updates existing device last_login
- Enforces device limit

### `src/app/(auth)/login/page.tsx`
- Collects credentials
- Calls getDeviceId() and getDeviceDetails()
- Passes to login action

### `src/app/(auth)/auth/device-approval/page.tsx`
- Shows waiting page for pending devices
- Real-time subscription for status changes
- Auto-redirects when approved

## Need More Help?

See `DEVICE_RECOGNITION_FIX_SUMMARY.md` for comprehensive documentation.
