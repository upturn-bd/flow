# Stakeholder Team Permissions Fix

## Issues Fixed
1. Users assigned to the correct teams were unable to mark stakeholder steps as completed
2. Independent (non-sequential) processes were incorrectly restricting access to only the "current" step

## Root Causes

### Issue 1: Missing Team Permission Checks
The stakeholder detail page (`/src/app/(home)/admin-management/stakeholders/[id]/page.tsx`) was only checking:
1. If the step was the current step
2. If the stakeholder was not completed

It was **NOT** checking:
- If the user is a member of the team assigned to the step
- If the user has full write permissions to override team restrictions

### Issue 2: Sequential Logic Applied to All Processes
The system was treating all processes as sequential, meaning only the "current step" could be edited. For independent processes, users should be able to work on any incomplete step they have team access to.

## Changes Made

### 1. Enhanced `useTeams` Hook (`/src/hooks/useTeams.tsx`)
Added two new utility functions:

- **`isTeamMember(teamId, employeeId?)`**: Checks if an employee is a member of a specific team
- **`getEmployeeTeamIds(employeeId?)`**: Returns all team IDs that an employee belongs to

These functions enable efficient team membership verification throughout the application.

### 2. Updated Stakeholder Detail Page (`/src/app/(home)/admin-management/stakeholders/[id]/page.tsx`)

#### New Imports
```tsx
import { useTeams } from "@/hooks/useTeams";
import { usePermissions } from "@/hooks/usePermissions";
```

#### New State
```tsx
const [userTeamIds, setUserTeamIds] = useState<number[]>([]);
```

#### New Effect to Load User Teams
```tsx
useEffect(() => {
  const loadUserTeams = async () => {
    try {
      const teamIds = await getEmployeeTeamIds();
      setUserTeamIds(teamIds);
    } catch (err) {
      console.error("Error loading user teams:", err);
    }
  };
  loadUserTeams();
}, [getEmployeeTeamIds]);
```

#### Enhanced `canEdit` Logic
**Before:**
```tsx
const canEdit = isCurrent && !stakeholder.is_completed;
```

**After:**
```tsx
const isSequential = stakeholder.process?.is_sequential || false;
const isTeamMember = step.team_id ? userTeamIds.includes(step.team_id) : false;
const hasFullWritePermission = hasPermission('stakeholders', 'can_write');
const hasTeamAccess = isTeamMember || hasFullWritePermission;

const canEdit = !stakeholder.is_completed && 
               !isCompleted &&
               hasTeamAccess &&
               (isSequential ? isCurrent : true);
```

**Key improvements:**
- Checks team membership or full write permission
- Differentiates between sequential and independent processes
- For sequential: only current step can be edited
- For independent: any incomplete step with team access can be edited

#### User Feedback
Added context-aware messages based on different scenarios:

**Team Access Denied:**
```tsx
{!stakeholder.is_completed && !isCompleted && !hasTeamAccess && (
  <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
    You must be a member of the {step.team?.name || "assigned team"} to work on this step
  </div>
)}
```

**Sequential Process - Step Not Current:**
```tsx
{!stakeholder.is_completed && !isCompleted && hasTeamAccess && isSequential && !isCurrent && (
  <div className="mt-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
    This step will become available after completing the previous steps (sequential process)
  </div>
)}
```

**Visual Indicator for Available Independent Steps:**
```tsx
className={`border rounded-lg ${
  isCurrent ? "border-blue-300 bg-blue-50"
  : isCompleted ? "border-green-300 bg-green-50"
  : canEdit && !isSequential ? "border-blue-200 bg-blue-25"  // Available step in independent process
  : "border-gray-200 bg-gray-50"
}`}
```

## How It Works

### Permission Check Flow
1. **Load user's teams**: On page load, fetch all team IDs the current user belongs to
2. **Identify process type**: Check if the process is sequential (`is_sequential`)
3. **Check step access**: For each step, verify:
   - Is the stakeholder still active? (`!stakeholder.is_completed`)
   - Is the step incomplete? (`!isCompleted`)
   - Is the user in the assigned team? (`userTeamIds.includes(step.team_id)`)
   - OR does user have full write permission? (`hasPermission('stakeholders', 'can_write')`)
   - **For sequential processes**: Is this the current step? (`isCurrent`)
   - **For independent processes**: Always true (any incomplete step is accessible)
4. **Show appropriate UI**:
   - If `canEdit` is true: Show "Work on Step" button
   - If access denied due to team: Show team requirement message
   - If sequential and not current: Show sequential process message
   - If step is completed: Show completed data

### Process Type Handling

#### Sequential Processes (`is_sequential = true`)
- Steps must be completed in order
- Only the current step is editable
- Users must be team members (or have full write permission)
- Completing a step advances to the next one
- **Use case**: Onboarding flows, approval chains

#### Independent Processes (`is_sequential = false`)
- Steps can be completed in any order
- Multiple steps can be worked on simultaneously
- All incomplete steps are editable (with proper team access)
- Stakeholder completes when all steps are done
- **Use case**: Documentation collection, parallel workflows

### Database-Level Protection
The fix complements existing RLS policies in `stakeholder_refactor_migration.sql`:

```sql
CREATE POLICY "Team members can write their step data" ON stakeholder_step_data
  FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'stakeholders', 'can_read')
    AND (
      -- Member of team assigned to this step
      EXISTS (
        SELECT 1 
        FROM stakeholder_process_steps sps
        JOIN team_members tm ON tm.team_id = sps.team_id
        WHERE sps.id = stakeholder_step_data.step_id
          AND tm.employee_id = auth.uid()
      )
      -- OR has full write permission
      OR has_permission(auth.uid(), 'stakeholders', 'can_write')
    )
  );
```

This provides **defense in depth** - UI prevents unauthorized attempts, and database enforces the rules.

## Testing Checklist

### For Regular Team Members (Sequential Process)
- [ ] Can see stakeholder detail page
- [ ] Can see all process steps
- [ ] Can see team assignments for each step
- [ ] **Can only** work on the current step assigned to their team(s)
- [ ] Cannot work on future steps (see sequential message)
- [ ] Cannot work on steps assigned to other teams (see team requirement message)
- [ ] Can save drafts for their current step
- [ ] Can complete their current step
- [ ] Step advances to next after completion
- [ ] Cannot bypass restrictions via API

### For Regular Team Members (Independent Process)
- [ ] Can see stakeholder detail page
- [ ] Can see all process steps with visual indicators
- [ ] Available steps show lighter blue border/background
- [ ] **Can work on multiple** incomplete steps assigned to their team(s) simultaneously
- [ ] Cannot work on steps assigned to other teams
- [ ] Can save drafts for multiple steps
- [ ] Can complete steps in any order
- [ ] Stakeholder completes when all steps are done
- [ ] Cannot bypass restrictions via API

### For Users with Full Write Permission
- [ ] Can work on **any** step in sequential processes
- [ ] Can work on **any** step in independent processes
- [ ] Can complete any step
- [ ] No team restriction messages shown
- [ ] Can override sequential requirements

### For Users Not in Any Teams
- [ ] Can view stakeholder details (if they have read permission)
- [ ] Cannot edit any steps (unless they have full write permission)
- [ ] See appropriate messages explaining why they can't edit

## Benefits

1. **Security**: Proper enforcement of team-based access control
2. **User Experience**: Clear feedback when users can't perform actions
3. **Compliance**: Aligns UI with database RLS policies
4. **Maintainability**: Reusable team membership functions in `useTeams` hook
5. **Performance**: Efficient batch loading of team IDs on mount

## Related Files

- `/src/hooks/useTeams.tsx` - Team management and membership checks
- `/src/hooks/usePermissions.tsx` - Permission verification
- `/src/app/(home)/admin-management/stakeholders/[id]/page.tsx` - Stakeholder detail UI
- `/sql/stakeholder_refactor_migration.sql` - RLS policies for step data
- `/sql/setup_team_permissions_system.sql` - Team permission functions

## Notes

- The fix maintains backward compatibility with existing stakeholder data
- No database migrations required - only code changes
- The solution follows the project's established patterns (hooks, permissions, RLS)
- Team membership is cached on page load for performance
