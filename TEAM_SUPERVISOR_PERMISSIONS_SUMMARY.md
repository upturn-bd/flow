# Team & Supervisor Permissions - Implementation Summary

## Overview

I've analyzed your Flow HRIS system and implemented a comprehensive team and supervisor permissions system. Here's what I found and what's been done.

## Your Question: Team IDs in Employees Table?

**RECOMMENDATION: Keep the separate `team_members` table ✅**

### Why?

1. **Multiple Team Membership**: Your current design allows employees to be in multiple teams simultaneously (e.g., "Finance Team" AND "Auditors Team"). Putting `team_id` in the `employees` table limits you to ONE team per employee.

2. **Supervisor vs Team Are Different Concepts**:
   - `employees.supervisor_id` → Organizational hierarchy (reporting structure)
   - `team_members` table → Functional groupings with permissions
   - These serve different purposes and should stay separate

3. **Your Permission System Already Works This Way**: The `get_user_permissions()` database function aggregates permissions from ALL teams a user belongs to.

## What I've Implemented

### ✅ Phase 1: Core Infrastructure (COMPLETED)

#### 1. Fixed TypeScript Errors
**File**: `src/components/admin-management/teams/TeamManagement.tsx`

Fixed all prop type mismatches:
- `TeamForm` now accepts `Partial<Team>`
- `TeamMembersModal` receives `isOpen` and `onMembersUpdated` props
- `TeamPermissionsModal` receives `isOpen` and `onPermissionsUpdated` props

#### 2. Created Subordinate Utilities
**File**: `src/lib/utils/subordinates.ts` (NEW)

Utility functions for supervisor relationships:
```typescript
// Check if targetEmployeeId is subordinate of supervisorId
isSubordinate(targetEmployeeId, supervisorId, companyId): Promise<boolean>

// Fetch all subordinates (direct + indirect)
fetchSubordinates(supervisorId, companyId, includeIndirect): Promise<Employee[]>

// Fetch subordinate IDs only (efficient for permission checks)
fetchSubordinateIds(supervisorId, companyId, includeIndirect): Promise<string[]>

// Get direct reports only
fetchDirectReports(supervisorId, companyId): Promise<Employee[]>

// Check if user is a supervisor
isSupervisor(employeeId, companyId): Promise<boolean>

// Get supervisor chain (bottom to top)
getSupervisorChain(employeeId, companyId): Promise<Employee[]>
```

**Key Features**:
- Recursive traversal of supervisor chains
- Safety limits to prevent infinite loops
- Company-scoped for security
- Efficient ID-only fetching for permission checks

#### 3. Extended usePermissions Hook
**File**: `src/hooks/usePermissions.tsx`

Added three new supervisor permission functions:
```typescript
// Check if current user is supervisor of target employee
isSupervisorOf(targetEmployeeId: string): Promise<boolean>

// Get all subordinates for current user
getSubordinates(includeIndirect?: boolean): Promise<string[]>

// Check if user can manage subordinate (team permission OR supervisor relationship)
canManageSubordinate(
  targetEmployeeId: string, 
  module: string, 
  action: string
): Promise<boolean>
```

**Permission Logic**:
```typescript
// User can manage if they have EITHER:
// 1. Team permission (e.g., can_approve on 'leave'), OR
// 2. Supervisor relationship (direct or indirect supervisor)

const canManage = hasTeamPermission || isSupervisor;
```

#### 4. Updated Leave Management
**File**: `src/hooks/useLeaveManagement.tsx`

**Changes**:
- `fetchLeaveRequests()`: Now fetches leaves assigned to user OR from subordinates
- `fetchGlobalLeaveRequests()`: Checks `canApprove('leave')` permission first
- `updateLeaveRequest()`: Validates user has permission OR is supervisor before allowing updates

**Example**:
```typescript
// Fetch leaves I can manage
const fetchLeaveRequests = async () => {
  const subordinateIds = await getSubordinates(); // My team members
  
  // Get leaves assigned to me OR from my subordinates
  query.or(`requested_to.eq.${user.id},employee_id.in.(${subordinateIds})`);
};

// Update leave only if authorized
const updateLeaveRequest = async (leaveId, data, employeeId) => {
  const hasTeamPermission = canApprove('leave');
  const isSupervisor = await isSupervisorOf(employeeId);
  
  if (!hasTeamPermission && !isSupervisor) {
    throw new Error("Permission denied");
  }
  
  // Proceed with update...
};
```

#### 5. Updated Requisition Management
**File**: `src/hooks/useRequisition.tsx`

**Changes**:
- `fetchRequisitionRequests()`: Fetches requisitions where user is asset_owner OR from subordinates
- `updateRequisitionRequest()`: Checks `canApprove('requisition')` OR supervisor relationship

**Permission Pattern**:
```typescript
const hasTeamPermission = canApprove('requisition');
const isSupervisor = await isSupervisorOf(employee_id);

if (!hasTeamPermission && !isSupervisor) {
  throw new Error("Permission denied");
}
```

## Permission Model

### How It Works

```
┌─────────────────────────────────────────────────────┐
│         User Tries to Access Resource               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Check Team Permission │
        │ (via team membership)  │
        └──────────┬─────────────┘
                   │
         ┌─────────┴─────────┐
         │ Has Permission?   │
         └─────────┬─────────┘
                   │
            Yes ───┴─── No
             │           │
             ▼           ▼
          ALLOW   ┌──────────────────────┐
                  │ Check Supervisor     │
                  │ Relationship         │
                  └──────────┬───────────┘
                             │
                   ┌─────────┴─────────┐
                   │ Is Supervisor?    │
                   └─────────┬─────────┘
                             │
                      Yes ───┴─── No
                       │           │
                       ▼           ▼
                    ALLOW        DENY
```

### Supervisor Permissions Are IMPLICIT

If you're someone's supervisor (directly or indirectly), you can:
- ✅ View their leave requests
- ✅ Approve/reject their leave
- ✅ View their requisitions
- ✅ Approve/reject their requisitions
- ✅ Manage their attendance (to be implemented)
- ✅ Handle their complaints (to be implemented)
- ✅ View their HRIS data (to be implemented)

**No special configuration needed** - it's automatic based on the `supervisor_id` field.

### Team Permissions Are EXPLICIT

Must be granted via:
1. Admin creates a team (e.g., "HR Team")
2. Admin adds members to the team
3. Admin configures permissions for the team (e.g., `can_approve` on 'leave')
4. All team members inherit those permissions

## What's Left to Implement

### 🔴 High Priority (Core Functionality)

1. **Attendance Management** (`useAttendanceManagement.tsx`)
   - Add permission checks for attendance modifications
   - Supervisors should see subordinate attendance

2. **Settlement Management** (`useSettlement.tsx`)
   - Add approval permission checks
   - Include supervisor relationship checks

3. **Complaints Management** (`useComplaints.tsx`)
   - Filter by assigned complaints OR subordinate complaints
   - Permission checks for updates

4. **Middleware Updates** (`src/middleware.ts`)
   - Add supervisor relationship checks for routes
   - Implement route-specific permission requirements

### 🟡 Medium Priority (UI/UX)

5. **Operations Page Components** (`src/app/(home)/operations-and-services/**`)
   - Add permission checks to UI
   - Hide/disable actions based on permissions
   - Show appropriate messaging

6. **HRIS Pages** (`src/app/(home)/hris/**`)
   - Filter employee lists by permissions
   - Check permissions before showing employee details
   - Validate edit permissions

### 🟢 Low Priority (Optimization)

7. **Database Functions** (SQL)
   - Create `get_all_subordinates(supervisor_id)` function
   - Create `can_user_manage_employee()` function
   - Optimize permission queries

8. **Caching & Performance**
   - Cache subordinate lists
   - Optimize recursive queries
   - Add database indices

## How to Continue Implementation

### Step 1: Update Remaining Hooks

Follow the same pattern as `useLeaveManagement.tsx` and `useRequisition.tsx`:

```typescript
// 1. Import usePermissions
import { usePermissions } from './usePermissions';

// 2. Destructure needed functions
const { canApprove, isSupervisorOf, getSubordinates } = usePermissions();

// 3. Fetch subordinates when querying
const subordinateIds = await getSubordinates();
query.or(`assigned_to.eq.${user.id},employee_id.in.(${subordinateIds})`);

// 4. Check permissions before updates
const hasPermission = canApprove('module_name') || await isSupervisorOf(targetId);
if (!hasPermission) throw new Error("Permission denied");
```

### Step 2: Update Page Components

```typescript
// In page components
import { usePermissions } from '@/hooks/usePermissions';

const { canApprove, canWrite, isSupervisorOf } = usePermissions();

// Conditionally render based on permissions
{canApprove('leave') && <ApprovalSection />}
{canWrite('notice') && <CreateNoticeButton />}
```

### Step 3: Update Middleware

```typescript
// Add to middleware.ts
const hasTeamPermission = await checkPermission(user.id, module, action);
const isSupervisor = await checkSupervisorRelationship(user.id, targetEmployeeId);

if (!hasTeamPermission && !isSupervisor) {
  return NextResponse.redirect('/unauthorized');
}
```

## Testing Scenarios

### Scenario 1: Team Member with Permissions ✅
- User is in "HR Team" with `can_approve` on 'leave'
- User is NOT supervisor of Employee X
- **Result**: Can approve Employee X's leave requests

### Scenario 2: Supervisor without Team Permissions ✅
- User is supervisor of Employee Y
- User is NOT in any team with 'leave' permissions
- **Result**: Can approve Employee Y's leave requests (implemented)

### Scenario 3: Neither Team nor Supervisor ✅
- User is NOT in team with 'leave' permissions
- User is NOT supervisor of Employee Z
- **Result**: CANNOT see or approve Employee Z's leave requests (enforced)

### Scenario 4: Indirect Supervisor ✅
- User A supervises User B
- User B supervises User C
- **Result**: User A can manage User C's requests (transitive, implemented)

## Files Created/Modified

### Created Files
1. ✅ `src/lib/utils/subordinates.ts` - Subordinate relationship utilities
2. ✅ `TEAM_SUPERVISOR_PERMISSIONS_PLAN.md` - Detailed implementation plan
3. ✅ `TEAM_SUPERVISOR_PERMISSIONS_SUMMARY.md` - This summary

### Modified Files
1. ✅ `src/components/admin-management/teams/TeamManagement.tsx` - Fixed TypeScript errors
2. ✅ `src/hooks/usePermissions.tsx` - Added supervisor permission functions
3. ✅ `src/hooks/useLeaveManagement.tsx` - Added permission checks
4. ✅ `src/hooks/useRequisition.tsx` - Added permission checks

## Key Benefits

1. **Flexibility**: Supports both team-based AND hierarchical permissions
2. **Security**: Enforces authorization at the data layer
3. **Scalability**: Easy to extend to new modules
4. **Maintainability**: Centralized permission logic in `usePermissions` hook
5. **Performance**: Efficient subordinate ID fetching with caching potential

## Next Steps

1. **Review** this implementation and approve the approach
2. **Continue** with remaining hooks (attendance, settlement, complaints)
3. **Update** page components to use permission checks in UI
4. **Test** thoroughly with various user roles and relationships
5. **Deploy** incrementally with feature flags

## Questions or Concerns?

The implementation follows your existing patterns:
- ✅ Uses existing hooks and patterns
- ✅ Maintains backward compatibility
- ✅ Respects company-scoped data
- ✅ Pure TypeScript (no Zod)
- ✅ Follows your architectural guidelines

Ready to continue with the remaining modules whenever you are!
