# Flow HRIS - Deployment Checklist

## Pre-Launch Status

| Category | Status | Priority |
|----------|--------|----------|
| Error monitoring | ✅ Sentry configured | High |
| Database backups | ❌ Need to configure | High |

---

## Error Monitoring (Sentry) - Setup Instructions

### 1. Create Sentry Account & Project
1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project → Select **Next.js**
3. Note down your **DSN** from the project settings

### 2. Set Environment Variables
Add these to your `.env.local` (development) and your hosting platform (production):

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token  # Get from Settings > Auth Tokens
```

### 3. What's Tracked
- **Client-side errors**: JavaScript errors, unhandled promise rejections
- **Server-side errors**: API route errors, SSR errors
- **User context**: User ID, email, company, role (for identifying affected users)
- **Session replay**: 10% of sessions, 100% of error sessions (anonymized)
- **Performance**: Page load times, API response times

### 4. Using Sentry in Code

```typescript
// Import the utilities
import { captureError, captureMessage, addBreadcrumb } from "@/lib/sentry";

// Capture a custom error with context
try {
  await riskyOperation();
} catch (error) {
  captureError(error as Error, { 
    operation: "riskyOperation",
    userId: user.id 
  });
}

// Add breadcrumbs for debugging
addBreadcrumb("User clicked submit", "user-action", { formId: "leave-request" });

// Capture informational messages
captureMessage("Large file upload completed", { fileSize: "50MB" });
```

### 5. Enable User Context (Recommended)
In your main app layout, add the Sentry user hook:

```typescript
import { useSentryUser } from "@/lib/sentry";

function AppContent({ children }) {
  useSentryUser(); // Sets user context for all errors
  return <>{children}</>;
}
```

### 6. Sentry Dashboard Features
- **Issues**: View all errors grouped by type
- **Performance**: Monitor slow pages and API calls
- **Session Replay**: Watch user sessions that led to errors
- **Alerts**: Set up Slack/email notifications for new errors
- **Release Tracking**: Track which deploy introduced bugs

---