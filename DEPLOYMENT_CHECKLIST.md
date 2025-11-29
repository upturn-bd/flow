# Flow HRIS - Deployment Checklist

## Pre-Launch Status

| Category | Status | Priority |
|----------|--------|----------|
| Error monitoring | ✅ Sentry fully configured | High |
| Database backups | ❌ Need to configure | High |

---

## Error Monitoring (Sentry) - ✅ FULLY CONFIGURED

### Project Details
- **Organization**: upturn-bd
- **Project**: javascript-nextjs
- **Dashboard**: [sentry.io/organizations/upturn-bd](https://sentry.io/organizations/upturn-bd/projects/javascript-nextjs/)

### Environment Variables for CI/CD
Add this to your hosting platform (Vercel, etc.):

```env
SENTRY_AUTH_TOKEN=<your-auth-token-from-ci-setup>
```

### Error Types Captured

| Error Type | Status | Description |
|------------|--------|-------------|
| Client JS errors | ✅ | Unhandled exceptions, promise rejections |
| Server errors | ✅ | API routes, SSR, server actions |
| React component crashes | ✅ | Error boundaries in place |
| Supabase/DB errors | ✅ | Tagged with `error_type: supabase` |
| API/fetch errors | ✅ | Captured with endpoint context |
| 404 Not Found | ✅ | Custom page at `/not-found.tsx` |
| Console errors | ✅ | `console.error` captured as breadcrumbs |
| User context | ✅ | User ID, email, company, role on all errors |
| Session replay | ✅ | Video replay on error sessions |
| Performance | ✅ | Page loads, API response times |

### Error Pages Created
- `src/app/global-error.tsx` - Catches all unhandled errors
- `src/app/(home)/error.tsx` - Route-level error boundary
- `src/app/not-found.tsx` - 404 page
- `src/components/ErrorBoundary.tsx` - Reusable component error boundary

### Sentry Utilities (`src/lib/sentry.ts`)

```typescript
// Capture any error with context
captureError(error, { operation: "createEmployee", userId: id });

// Capture Supabase errors specifically
captureSupabaseError(supabaseError, "fetchEmployees", { companyId });

// Capture API errors
captureApiError(response, "POST /api/employees");

// Add breadcrumbs for debugging
addBreadcrumb("User clicked submit", "user-action", { formId: "leave" });

// Wrap expensive operations with performance tracking
const result = await withSpan("loadDashboard", "db.query", async () => {
  return await fetchDashboardData();
});

// Safe error logging (logs + sends to Sentry)
logError("Error fetching employees", error, { companyId });
```

### Using ErrorBoundary Component

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Wrap components that might fail
<ErrorBoundary componentName="EmployeeTable">
  <EmployeeTable />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary 
  componentName="Dashboard"
  fallback={<DashboardSkeleton />}
>
  <Dashboard />
</ErrorBoundary>
```

### Clean Up Before Production
- [ ] Remove `/sentry-example-page` after testing
- [ ] Remove `/api/sentry-example-api` after testing
- [x] ~~Reduce `tracesSampleRate` to 0.1-0.2~~ ✅ Done (10% client, 10-20% server, 5% edge)
- [x] ~~Reduce `replaysSessionSampleRate`~~ ✅ Done (1% normal, 100% on error)
- [ ] Set up Slack/Email alerts in Sentry dashboard
- [ ] Create alert rules for critical errors

### Current Sample Rates (Optimized for Cost)

| Config | Traces | Replays | Notes |
|--------|--------|---------|-------|
| Client | 10% | 1% normal, 100% on error | Smart sampling enabled |
| Server | 10% base, 20% API routes | N/A | Health checks excluded |
| Edge | 5% | N/A | Low rate for middleware |

---