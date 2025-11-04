# Stakeholder Issues Migration - assigned_to Implementation

## Summary of Changes

This migration refactors the stakeholder issues system to use individual employee assignment (`assigned_to`) instead of the deprecated `issue_handler_id` approach. 

### Key Changes:

1. **Database Schema** (`sql/stakeholder_issues_assigned_to_migration.sql`)
   - Added `assigned_to` UUID field to `stakeholder_issues` table
   - Created indexes for performance optimization
   - Migrated existing data from stakeholder's `issue_handler_id` to issue's `assigned_to`
   - Updated RLS policies for proper access control
   - Note: `issue_handler_id` in stakeholders is now `kam_id` (Key Account Manager)

2. **TypeScript Interfaces** (`src/lib/types/schemas.ts`)
   - Updated `Stakeholder` interface:
     - Changed `issue_handler_id` → `kam_id` (Key Account Manager)
     - Changed joined data `issue_handler` → `kam`
   - Updated `StakeholderIssue` interface:
     - Added `assigned_to?: string` field
     - Added `assigned_employee` joined data for employee details

3. **Hook Updates** (`src/hooks/useStakeholderIssues.tsx`)
   - Updated `StakeholderIssueFormData` to include `assigned_to` field
   - Renamed `StakeholderIssueSearchOptions.handlerId` → `assignedToId`
   - Refactored `fetchIssues()` to join with `assigned_employee` data
   - Refactored `fetchIssueById()` to join with `assigned_employee` data
   - Renamed `fetchIssuesByHandler()` → `fetchIssuesByAssignedEmployee()`
   - Updated `searchIssues()` to filter by `assigned_to` instead of stakeholder's `issue_handler_id`
   - Updated `createIssue()` to save `assigned_to` field

4. **UI Components** (`src/components/stakeholder-issues/StakeholderIssueForm.tsx`)
   - Added employee dropdown selector using `useEmployees` hook
   - Loads all employees from company
   - Allows optional assignment during issue creation/editing
   - Shows assigned employee in form

## Migration Steps

### Step 1: Run the SQL Migration

Connect to your Supabase database and run the migration script:

```bash
# Option 1: Using Supabase CLI
supabase db execute < sql/stakeholder_issues_assigned_to_migration.sql

# Option 2: Copy and paste the SQL from the file into Supabase SQL Editor
```

### Step 2: Verify Database Changes

Check that the new column exists:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'stakeholder_issues' 
AND column_name = 'assigned_to';
```

Check that data was migrated (if you had existing issues):

```sql
SELECT id, title, assigned_to 
FROM stakeholder_issues 
LIMIT 10;
```

### Step 3: Test the Application

1. **Create a new issue:**
   - Navigate to a stakeholder's issues tab
   - Click "Create Issue"
   - Verify the "Assign To Employee" dropdown appears
   - Select an employee and create the issue
   - Verify the issue is created with the correct `assigned_to` value

2. **View assigned issues:**
   - Test filtering issues by assigned employee
   - Verify the `fetchIssuesByAssignedEmployee()` function works

3. **Update existing issues:**
   - Edit an existing issue
   - Change the assigned employee
   - Verify the update is saved correctly

## API Changes

### Breaking Changes

⚠️ **Functions Renamed:**
- `fetchIssuesByHandler(handlerId)` → `fetchIssuesByAssignedEmployee(assignedToId)`

### Updated Interfaces

```typescript
// Old
interface StakeholderIssueSearchOptions {
  handlerId?: string;
}

// New
interface StakeholderIssueSearchOptions {
  assignedToId?: string;
}

// Old
interface StakeholderIssueFormData {
  // ... no assigned_to field
}

// New
interface StakeholderIssueFormData {
  assigned_to?: string;
  // ... other fields
}
```

### Query Updates

**Before:**
```typescript
// Filtered by stakeholder's issue_handler_id
.eq("stakeholder.issue_handler_id", handlerId)
```

**After:**
```typescript
// Filters directly on issue's assigned_to
.eq("assigned_to", assignedToId)
```

## Benefits of This Change

1. **Flexibility:** Issues can now be assigned to different employees, not just the stakeholder's handler
2. **Clarity:** Separation of concerns between KAM (overall stakeholder management) and issue assignment
3. **Better Tracking:** Can see exactly who is responsible for each issue
4. **Improved Queries:** Direct filtering on issues table instead of joining to stakeholders

## Rollback Plan

If you need to rollback this migration:

```sql
-- Remove the assigned_to column
ALTER TABLE stakeholder_issues DROP COLUMN IF EXISTS assigned_to;

-- Restore old RLS policies (refer to stakeholder_issue_tracking.sql)
```

## Future Enhancements

Consider adding:
- Multiple assignees per issue
- Assignment history/audit trail
- Automatic assignment based on workload
- Email notifications when assigned
- Issue reassignment workflow

## Testing Checklist

- [ ] SQL migration runs without errors
- [ ] `assigned_to` column exists in `stakeholder_issues` table
- [ ] Existing issues have `assigned_to` populated (if applicable)
- [ ] Can create new issues with assigned employee
- [ ] Can update issue assignments
- [ ] `fetchIssuesByAssignedEmployee()` returns correct results
- [ ] Employee dropdown loads correctly in form
- [ ] TypeScript compilation succeeds
- [ ] No console errors in browser
- [ ] RLS policies work correctly

---

**Migration Date:** November 4, 2025
**Author:** Flow HRIS Development Team
