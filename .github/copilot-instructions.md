````instructions
# Copilot Instructions for Flow HRIS System

## Project Overview

**Next.js 15 + Supabase Operations Management System** with team-based permissions (not legacy roles). Uses `bun` as the JavaScript runtime.

## Architecture

### Route Groups
- `(auth)/*` - Authentication (login, signup, forgot-password)
- `(home)/*` - Main app (requires `has_approval` = "ACCEPTED")
- `(superadmin)/sa/*` - Superadmin panel for platform management
- `public-stakeholders/[company]/[stakeholder]` - Public stakeholder ticket submission (no auth required)

### Permission System (Team-Based - NOT Legacy Roles)
**IMPORTANT**: Legacy roles (Admin, Manager, Employee) are being phased out. Use team-based permissions:

```typescript
// Use AuthContext for permission checks
const { canRead, canWrite, canDelete, canApprove } = useAuth();

// Check permissions by module (from PERMISSION_MODULES in constants)
if (canWrite('tasks')) { /* can create/edit tasks */ }
if (canApprove('leave')) { /* can approve leave requests */ }

// Available modules: tasks, projects, milestones, attendance, leave, notice,
// requisition, settlement, complaints, payroll, stakeholders, stakeholder_processes,
// onboarding, offboarding, hris, admin_config, departments, divisions, grades, positions, teams
```

Permissions are aggregated from all teams a user belongs to via `get_user_permissions` RPC.

### Supabase Integration
- **Server**: `createClient()` from `src/lib/supabase/server.ts`
- **Client**: `supabase` from `src/lib/supabase/client.ts`
- **Realtime**: `NotificationManager` in `src/lib/realtime/notificationManager.ts` for WebSocket subscriptions

## Key Patterns

### Form Architecture
```typescript
// Use BaseForm + useFormState for all forms
import { BaseForm } from '@/components/forms/BaseForm';
import { useFormState } from '@/hooks/useFormState';

// Validation: Pure TypeScript functions (NO Zod)
// Use validationErrorsToObject helper for error display
```

### User/Employee Search (CRITICAL)
Always use utilities from `src/lib/utils/user-search.ts`:
```typescript
import { matchesEmployeeSearch, filterEmployeesBySearch } from '@/lib/utils/user-search';
// Searches by: name, email, designation (in priority order)
```

### UI Conventions
- **Icons**: ONLY Phosphor Icons (`@phosphor-icons/react`) - import from `src/lib/icons.ts`
- **Colors**: NEVER hardcode - use theme variables (`bg-primary-500`, `text-foreground-primary`)
- **Components**: Use existing UI components from `src/components/ui/`

### Error Tracking (Sentry)
```typescript
import { captureError, captureSupabaseError } from '@/lib/sentry';

// In catch blocks:
captureError(error, { operation: 'createTask', taskId: id });

// For Supabase errors:
captureSupabaseError(error, 'fetchEmployees', { companyId });

// Set user context in authenticated layouts:
import { useSentryUser } from '@/lib/sentry';
useSentryUser(); // Call in layout component
```

### Email Notifications (Resend)
```typescript
import { sendEmail, sendNotificationEmail } from '@/lib/email';
// Requires RESEND_API_KEY environment variable
// Templates in src/lib/email/notification-email.ts and stakeholder-ticket-email.ts
```

## Device Management
Users are restricted by `max_device_limit` (configurable per company, default 3). Device approval flow:
- New devices create `user_devices` records with `status: 'pending'`
- Admins approve/reject via device management UI
- Exceeded limits block login until devices are approved or removed

## Stakeholder/Public Tickets System
Public-facing ticket submission at `/public-stakeholders/[company]/[stakeholder]`:
- Stakeholders access via unique `access_code`
- No authentication required
- Uses `usePublicStakeholderAccess` hook
- Categories/subcategories for ticket organization
- Checker team workflow for ticket resolution approval

## Development Commands
```bash
bun run dev          # Development server
bun run build        # Production build
bun test             # Run Playwright E2E tests
bun test:ui          # Tests with Playwright UI
```

## Adding New Features

### New Permission-Protected Feature
1. Add module to `PERMISSION_MODULES` in `src/lib/constants/index.ts`
2. Add `ModulePermissionsBanner` component for UI feedback
3. Use `canRead/canWrite/canDelete/canApprove` from `useAuth()`

### New Data Entity
1. Add interface to `src/lib/types/schemas.ts`
2. Create hook in `src/hooks/use[Entity].tsx` following `useEmployees` pattern
3. Always filter by `company_id`

### New Admin Page
1. Add route under `src/app/(home)/admin/`
2. Use `CollapsibleComponent` pattern for sections
3. Add `ModulePermissionsBanner` for access feedback

## Superadmin System
Platform-level management at `/sa/*`:
- Companies, countries, industries management
- Global team configuration
- User superadmin status management
- Requires `is_superadmin` flag (not team permissions)

## Key Files Reference
- Types: `src/lib/types/schemas.ts`
- Constants: `src/lib/constants/index.ts`
- Auth Context: `src/lib/auth/auth-context.tsx`
- Permissions Hook: `src/hooks/usePermissions.tsx`
- Teams Hook: `src/hooks/useTeams.tsx`
- Sentry Utils: `src/lib/sentry.ts`
- Email Utils: `src/lib/email/`
````
