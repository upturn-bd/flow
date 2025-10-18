# Team & Supervisor Permissions Implementation Plan

## Executive Summary

This document outlines the comprehensive plan to implement **team-based permissions** and **supervisor permissions** throughout the Flow HRIS system. The goal is to ensure all data access and modification operations are properly authorized based on either:

1. **Team Permissions**: Granular permissions assigned via team membership
2. **Supervisor Permissions**: Hierarchical permissions based on supervisor-employee relationships (supervisors can manage ALL subordinate data by default)

## Current State Analysis

### What's Already Implemented ✅

1. **Database Schema**: 
   - `teams`, `team_members`, `team_permissions` tables exist
   - `employees.supervisor_id` field for hierarchical relationships
   - Database function `get_user_permissions(user_id)` aggregates team permissions

2. **Permission Infrastructure**:
   - `usePermissions` hook provides: `canRead()`, `canWrite()`, `canDelete()`, `canApprove()`, `canComment()`
   - `AuthProvider` context fetches and provides user permissions
   - Permission constants defined in `src/lib/constants/index.ts`
   - Middleware checks permissions at route level

3. **Team Management UI**:
   - Full team CRUD operations in `src/components/admin-management/teams/`
   - Team member management modal
   - Team permissions configuration modal

### Current Gaps ❌

1. **No Supervisor Permission Checks**: Hooks and components don't verify if user is a supervisor of the target employee
2. **Inconsistent Permission Enforcement**: Some hooks use global fetching without permission checks
3. **Missing Permission Guards**: Many operations lack both team and supervisor permission validation
4. **No Subordinate Fetching Utility**: No helper to get all direct/indirect reports

## Architecture Design

### Permission Check Flow

```
User tries to access/modify resource
    ↓
1. Check Team Permissions (via usePermissions hook)
    - Does user have required team permission? → ALLOW
    ↓
2. Check Supervisor Relationship (via new isSupervisorOf function)
    - Is user the supervisor of target employee? → ALLOW
    - Is user in supervisor chain of target employee? → ALLOW
    ↓
3. Otherwise → DENY
```

### Key Principles

1. **Supervisor permissions are implicit**: If you're someone's supervisor, you can manage ALL their data
2. **Team permissions are explicit**: Must be granted via team membership
3. **Either is sufficient**: User needs EITHER team permission OR supervisor relationship
4. **Company scoping**: All checks must respect company_id boundaries

## Implementation Plan

### Phase 1: Core Permission Infrastructure (Priority: CRITICAL)

#### 1.1 Fix TypeScript Errors in Team Components
**Files**: `src/components/admin-management/teams/TeamManagement.tsx`

**Issues**:
- TeamForm onSubmit prop type mismatch
- TeamMembersModal missing `isOpen` and `onMembersUpdated` props
- TeamPermissionsModal missing `isOpen` and `onPermissionsUpdated` props

**Solution**: Update prop passing to match interface requirements

#### 1.2 Extend usePermissions Hook
**File**: `src/hooks/usePermissions.tsx`

**New Functions**:
```typescript
// Check if current user is supervisor of target employee
const isSupervisorOf = async (targetEmployeeId: string): Promise<boolean>

// Check if user can manage subordinate (is supervisor OR has team permission)
const canManageSubordinate = async (
  targetEmployeeId: string, 
  module: string, 
  action: string
): Promise<boolean>

// Get all subordinates (direct and indirect)
const getSubordinates = async (supervisorId?: string): Promise<string[]>
```

#### 1.3 Create Subordinate Utility Function
**File**: `src/lib/utils/subordinates.ts`

```typescript
// Fetch all subordinates recursively
export async function fetchSubordinates(
  supervisorId: string,
  companyId: number
): Promise<Employee[]>

// Check if one employee is subordinate of another
export async function isSubordinate(
  employeeId: string,
  supervisorId: string
): Promise<boolean>
```

### Phase 2: Update Core Hooks (Priority: HIGH)

#### 2.1 useLeaveManagement.tsx
**Changes**:
- `fetchLeaveRequests()`: Only fetch leaves where user is `requested_to` OR user has `can_approve` on 'leave' module
- `fetchGlobalLeaveRequests()`: Only if user has `can_read` on 'leave' OR is admin
- `updateLeaveRequest()`: Only if user is `requested_to` OR has `can_approve` on 'leave'

**Pattern**:
```typescript
const { canApprove, isSupervisorOf } = usePermissions();

const canManageLeave = async (leaveRecord) => {
  return canApprove('leave') || 
         leaveRecord.requested_to === currentUser.id ||
         await isSupervisorOf(leaveRecord.employee_id);
};
```

#### 2.2 useRequisition.tsx
**Changes**:
- `fetchRequisitionRequests()`: Only fetch where user is `asset_owner` OR has permissions
- `updateRequisitionRequest()`: Check permissions before allowing approval/rejection

#### 2.3 useAttendanceManagement.tsx
**Changes**:
- Add permission check before allowing attendance modifications
- Supervisors can manage subordinate attendance
- Team permission: `can_write` on 'attendance'

#### 2.4 useSettlement.tsx
**Changes**:
- Add supervisor and team permission checks for approval

#### 2.5 useComplaints.tsx
**Changes**:
- Only fetch complaints where user is `requested_to` OR has permissions
- Check permissions before allowing updates

### Phase 3: Update Middleware (Priority: HIGH)

#### 3.1 src/middleware.ts
**Changes**:
- Add route-specific permission requirements
- Check supervisor relationships for subordinate-specific routes
- Block access if user has neither team permission nor supervisor relationship

**Example**:
```typescript
// For routes like /hris/employee/:id
if (requestedEmployeeId) {
  const hasTeamPermission = await checkTeamPermission(user.id, 'hris', 'can_read');
  const isSupervisor = await checkSupervisorRelationship(user.id, requestedEmployeeId);
  
  if (!hasTeamPermission && !isSupervisor) {
    return NextResponse.redirect('/unauthorized');
  }
}
```

### Phase 4: Update Page Components (Priority: MEDIUM)

#### 4.1 Operations & Services Pages
**Files**: `src/app/(home)/operations-and-services/**/*.tsx`

**Changes**:
- Add permission checks using `usePermissions()` hook
- Hide/disable actions based on permissions
- Show appropriate messaging when lacking permissions

**Pattern**:
```typescript
const { canApprove, canWrite } = usePermissions();

const canManageLeave = canApprove('leave');
const canCreateNotice = canWrite('notice');

// Conditionally render action buttons
{canManageLeave && <ApprovalButtons />}
```

#### 4.2 HRIS Pages
**Files**: `src/app/(home)/hris/**/*.tsx`

**Changes**:
- Check `can_read` on 'hris' OR supervisor relationship before showing employee details
- Check `can_write` on 'hris' OR supervisor relationship before allowing edits
- Filter employee lists based on permissions

### Phase 5: Database Updates (Priority: LOW)

#### 5.1 Optimize Supervisor Queries
**New Function**: `get_all_subordinates(supervisor_id UUID)`

```sql
CREATE OR REPLACE FUNCTION get_all_subordinates(supervisor_id UUID)
RETURNS TABLE(employee_id UUID) AS $$
WITH RECURSIVE subordinates AS (
  -- Direct reports
  SELECT id as employee_id FROM employees WHERE supervisor_id = $1
  UNION
  -- Indirect reports
  SELECT e.id FROM employees e
  INNER JOIN subordinates s ON e.supervisor_id = s.employee_id
)
SELECT * FROM subordinates;
$$ LANGUAGE sql;
```

#### 5.2 Permission Check Function
**New Function**: `can_user_manage_employee(user_id UUID, target_id UUID, module TEXT, action TEXT)`

```sql
CREATE OR REPLACE FUNCTION can_user_manage_employee(
  user_id UUID, 
  target_id UUID, 
  module TEXT, 
  action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  has_team_permission BOOLEAN;
  is_supervisor BOOLEAN;
BEGIN
  -- Check team permission
  SELECT EXISTS(
    SELECT 1 FROM get_user_permissions(user_id) p
    WHERE p.module_name = module AND p[action] = true
  ) INTO has_team_permission;
  
  -- Check supervisor relationship
  WITH RECURSIVE supervisors AS (
    SELECT supervisor_id FROM employees WHERE id = target_id
    UNION
    SELECT e.supervisor_id FROM employees e
    INNER JOIN supervisors s ON e.id = s.supervisor_id
  )
  SELECT EXISTS(
    SELECT 1 FROM supervisors WHERE supervisor_id = user_id
  ) INTO is_supervisor;
  
  RETURN has_team_permission OR is_supervisor;
END;
$$ LANGUAGE plpgsql;
```

## Implementation Checklist

### Phase 1: Core Infrastructure
- [ ] Fix TeamManagement.tsx TypeScript errors
- [ ] Add `isSupervisorOf()` to usePermissions hook
- [ ] Add `canManageSubordinate()` to usePermissions hook
- [ ] Add `getSubordinates()` to usePermissions hook
- [ ] Create `src/lib/utils/subordinates.ts` utility file
- [ ] Test supervisor permission checks

### Phase 2: Core Hooks
- [ ] Update useLeaveManagement.tsx with permission checks
- [ ] Update useRequisition.tsx with permission checks
- [ ] Update useAttendanceManagement.tsx with permission checks
- [ ] Update useSettlement.tsx with permission checks
- [ ] Update useComplaints.tsx with permission checks
- [ ] Test each hook with various permission scenarios

### Phase 3: Middleware
- [ ] Update middleware.ts with supervisor checks
- [ ] Add route-specific permission requirements
- [ ] Test unauthorized access scenarios
- [ ] Test supervisor access to subordinate routes

### Phase 4: Page Components
- [ ] Update leave management pages
- [ ] Update requisition pages
- [ ] Update attendance pages
- [ ] Update settlement pages
- [ ] Update complaints pages
- [ ] Update HRIS employee detail pages
- [ ] Update HRIS employee list pages
- [ ] Test UI permission states

### Phase 5: Database
- [ ] Create get_all_subordinates() function
- [ ] Create can_user_manage_employee() function
- [ ] Optimize permission queries
- [ ] Test database functions

### Phase 6: Testing & Documentation
- [ ] Test team permission scenarios
- [ ] Test supervisor permission scenarios
- [ ] Test combined permission scenarios
- [ ] Test unauthorized access attempts
- [ ] Update API documentation
- [ ] Update user documentation

## Testing Scenarios

### Scenario 1: Team Member with Permissions
- User is in "HR Team" with `can_approve` on 'leave'
- User is NOT supervisor of Employee X
- **Expected**: Can approve Employee X's leave requests

### Scenario 2: Supervisor without Team Permissions
- User is supervisor of Employee Y
- User is NOT in any team with 'leave' permissions
- **Expected**: Can approve Employee Y's leave requests

### Scenario 3: Neither Team nor Supervisor
- User is NOT in team with 'leave' permissions
- User is NOT supervisor of Employee Z
- **Expected**: CANNOT see or approve Employee Z's leave requests

### Scenario 4: Indirect Supervisor
- User A supervises User B
- User B supervises User C
- **Expected**: User A can manage User C's requests (transitive)

### Scenario 5: Cross-Company Attempt
- User from Company A tries to access Employee from Company B
- **Expected**: DENIED regardless of permissions

## Migration Strategy

1. **Feature Flag**: Add `ENABLE_PERMISSION_CHECKS` environment variable
2. **Gradual Rollout**: Enable per module (start with non-critical modules)
3. **Logging**: Log permission check failures for monitoring
4. **Rollback Plan**: Disable feature flag if issues arise

## Success Criteria

1. ✅ All TypeScript errors resolved
2. ✅ All hooks enforce team and supervisor permissions
3. ✅ Middleware properly authorizes route access
4. ✅ UI components respect permission states
5. ✅ No unauthorized data access possible
6. ✅ Performance impact < 100ms per request
7. ✅ All existing functionality preserved

## Timeline Estimate

- **Phase 1**: 2-3 hours
- **Phase 2**: 4-6 hours
- **Phase 3**: 2-3 hours
- **Phase 4**: 6-8 hours
- **Phase 5**: 3-4 hours
- **Phase 6**: 4-6 hours

**Total**: 21-30 hours (3-4 days of focused work)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing functionality | HIGH | Thorough testing, feature flag |
| Performance degradation | MEDIUM | Database indexing, query optimization |
| Confusion about permission model | MEDIUM | Clear documentation, user training |
| Complex supervisor chains | LOW | Limit recursion depth, caching |

## Next Steps

1. Review and approve this plan
2. Fix TypeScript errors (Phase 1.1)
3. Implement core permission infrastructure (Phase 1.2-1.3)
4. Begin updating hooks one by one (Phase 2)
5. Continuous testing throughout implementation
