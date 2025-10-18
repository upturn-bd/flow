# How to Test the Team Management System

## Prerequisites

1. **Database Migration Complete** ✅
   - Run `sql/teams_permissions_system.sql` (creates tables, RLS policies, functions)
   - Run `sql/migrate_roles_to_teams.sql` (migrates existing users to default teams)
   - Verify migration: `SELECT * FROM migration_report;`

2. **Application Running**
   ```bash
   npm run dev
   ```

3. **Admin User Logged In**
   - You need an admin account to access `/admin-management`
   - Default team "Administrators" should have full permissions

---

## Test Scenarios

### 1. Access Team Management Page

**Steps**:
1. Navigate to `/admin-management`
2. Look for "Company Configurations" section
3. Click on "Teams" card (purple/violet icon)
4. Should redirect to `/admin-management/company-configurations/teams`

**Expected Result**:
- ✅ Teams page loads successfully
- ✅ Shows grid of existing teams (Administrators, Managers, Employees)
- ✅ Each team card shows:
  - Team name
  - Description
  - Member count
  - Action buttons (Edit, Delete, Manage Members, Configure Permissions)
- ✅ "+ New Team" button visible at top

---

### 2. Create a New Team

**Steps**:
1. Click "+ New Team" button
2. Modal should open with form
3. Enter team name: "Project Managers"
4. Enter description: "Team for managing projects and milestones"
5. Click "Create Team"

**Expected Result**:
- ✅ Modal closes
- ✅ New team appears in grid
- ✅ Success toast notification (if implemented)
- ✅ Member count shows 0

**Database Check**:
```sql
SELECT * FROM teams WHERE name = 'Project Managers';
```

---

### 3. Add Members to Team

**Steps**:
1. Find the "Project Managers" team card
2. Click "Manage Members" button
3. Modal opens with two columns
4. Left column should show search and available employees
5. Type employee name in search box
6. Select an employee (radio button)
7. Click "Add to Team"
8. Employee should move to right column "Current Members"
9. Add 2-3 more members
10. Click "Close"

**Expected Result**:
- ✅ Search filters employees by name
- ✅ Only non-member employees shown in left column
- ✅ Added employees appear in right column
- ✅ Member count on team card updates
- ✅ Join date shows for each member

**Database Check**:
```sql
SELECT 
  tm.*,
  e.name as employee_name
FROM team_members tm
JOIN employees e ON e.id = tm.employee_id
JOIN teams t ON t.id = tm.team_id
WHERE t.name = 'Project Managers';
```

---

### 4. Configure Team Permissions

**Steps**:
1. Click "Configure Permissions" on "Project Managers" team
2. Large modal opens with permission matrix
3. Find "Workflow" category
4. Check these boxes:
   - **Tasks**: Read, Write, Delete, Comment
   - **Projects**: Read, Write, Approve, Comment
   - **Milestones**: Read, Comment
5. Find "Services" category
6. Click "All" for "Read" column (gives read access to all services)
7. Find "Operations" category
8. Check **HRIS**: Read, Write
9. Click "Save Permissions"

**Expected Result**:
- ✅ Permission matrix displays all 21 modules
- ✅ Modules grouped by category (Workflow, Services, Operations, Admin)
- ✅ Checkboxes work for individual permissions
- ✅ "All"/"None" buttons work for bulk selection
- ✅ Modal closes after save
- ✅ Success message

**Database Check**:
```sql
SELECT 
  p.module_name,
  tp.can_read,
  tp.can_write,
  tp.can_delete,
  tp.can_approve,
  tp.can_comment
FROM team_permissions tp
JOIN permissions p ON p.id = tp.permission_id
JOIN teams t ON t.id = tp.team_id
WHERE t.name = 'Project Managers'
ORDER BY p.category, p.module_name;
```

---

### 5. Verify User Permissions

**Steps**:
1. Log in as one of the users added to "Project Managers" team
2. Open browser DevTools → Console
3. Check navigation items available
4. Try to access `/home/projects` (should work)
5. Try to access `/admin-management` (should fail unless also in Administrators team)

**Check in Database**:
```sql
-- Replace 'USER_ID' with actual employee ID
SELECT * FROM get_user_permissions('USER_ID');
```

**Expected Result**:
- ✅ User can access modules they have permissions for
- ✅ Navigation shows only authorized items
- ✅ Middleware protects unauthorized routes
- ✅ Permission checks in components work

---

### 6. Multi-Team Permissions

**Steps**:
1. Create another team: "HR Team"
2. Configure permissions:
   - Leave: Read, Write, Approve
   - Attendance: Read, Write
   - Onboarding: Read, Write, Approve
   - Offboarding: Read, Write, Approve
   - HRIS: Read, Write
3. Add same employee to both "Project Managers" AND "HR Team"
4. Log in as that employee
5. Check permissions

**Expected Result**:
- ✅ Employee has permissions from BOTH teams (OR logic)
- ✅ Can access projects (from Project Managers)
- ✅ Can approve leave (from HR Team)
- ✅ Can write to HRIS (from both teams)

**Database Check**:
```sql
-- Replace 'USER_ID' with actual employee ID
SELECT * FROM get_user_permissions('USER_ID');

-- Should show aggregated permissions across all teams
```

---

### 7. Edit Team Details

**Steps**:
1. Click pencil/edit icon on "Project Managers" team card
2. Modal opens with current values
3. Change name to "Project & Product Managers"
4. Update description
5. Click "Save Changes"

**Expected Result**:
- ✅ Modal closes
- ✅ Team card shows updated name and description
- ✅ Members and permissions unchanged

---

### 8. Remove Team Member

**Steps**:
1. Click "Manage Members" on any team
2. Find a member in right column
3. Click trash/delete icon next to member
4. Confirm deletion
5. Member should disappear from list

**Expected Result**:
- ✅ Confirmation dialog appears
- ✅ Member removed from team
- ✅ Member count decreases
- ✅ Member can be added back (appears in left column again)

**Database Check**:
```sql
-- Should not show the removed member
SELECT * FROM team_members WHERE team_id = X;
```

---

### 9. Delete a Team

**Steps**:
1. Create a test team: "Test Team"
2. Add 1-2 members
3. Click delete/trash icon on team card
4. Confirm deletion

**Expected Result**:
- ✅ Confirmation dialog appears
- ✅ Team removed from grid
- ✅ Team members removed (cascading delete)
- ✅ Team permissions removed (cascading delete)

**Database Check**:
```sql
SELECT * FROM teams WHERE name = 'Test Team';
-- Should return 0 rows

SELECT * FROM team_members WHERE team_id = X;
-- Should return 0 rows

SELECT * FROM team_permissions WHERE team_id = X;
-- Should return 0 rows
```

---

### 10. Default Teams Verification

**Steps**:
1. Check that default teams exist:
   - Administrators
   - Managers
   - Employees
2. Verify each has appropriate permissions
3. Check member counts match user counts

**Database Check**:
```sql
SELECT 
  t.name,
  t.is_default,
  COUNT(tm.id) as member_count,
  COUNT(DISTINCT tp.permission_id) as permission_count
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
LEFT JOIN team_permissions tp ON tp.team_id = t.id
WHERE t.is_default = TRUE
GROUP BY t.id, t.name, t.is_default;
```

**Expected Result**:
- ✅ All three default teams exist
- ✅ `is_default = true` for these teams
- ✅ Administrators has all 21 permissions
- ✅ Managers has subset of permissions
- ✅ Employees has basic permissions

---

## Performance Tests

### 11. Large Team Test

**Steps**:
1. Create team: "All Employees"
2. Add 50+ members (if available)
3. Configure permissions
4. Check load times

**Expected Result**:
- ✅ Member modal scrolls smoothly
- ✅ Search performs quickly
- ✅ Permission save completes in <2 seconds
- ✅ UI remains responsive

---

### 12. Permission Query Performance

**Check Query Speed**:
```sql
EXPLAIN ANALYZE SELECT * FROM get_user_permissions('USER_ID');
```

**Expected Result**:
- ✅ Query completes in <100ms
- ✅ Uses indexes on team_members, team_permissions
- ✅ No full table scans

---

## Edge Cases

### 13. Empty States

**Test**:
1. Create team with 0 members
2. Open "Manage Members" → should show "No members in this team yet"
3. Open "Configure Permissions" → should show all unchecked
4. Search for non-existent employee → "No employees found matching your search"

---

### 14. Permission Cascade

**Test**:
1. Give team "Projects: Read" only
2. User should NOT be able to write to projects
3. Update team to add "Projects: Write"
4. Refresh user session
5. User should now be able to write

**Database Function Test**:
```sql
SELECT has_permission('USER_ID', 'projects', 'write');
-- Should return FALSE before update, TRUE after
```

---

### 15. Company Isolation (RLS)

**Test**:
1. Create team in Company A
2. User from Company B should NOT see it
3. Check RLS policies are enforcing isolation

**Database Check**:
```sql
SET LOCAL row_security = on;
SET LOCAL request.jwt.claim.user_id = 'COMPANY_B_USER_ID';

SELECT * FROM teams;
-- Should only show Company B teams
```

---

## Bugs to Watch For

### Common Issues

1. **Permission ID Mismatch**
   - Symptoms: Permissions not saving or loading correctly
   - Check: `permissions` table has correct IDs for each module

2. **Duplicate Team Members**
   - Symptoms: Same user appears multiple times
   - Check: Unique constraint on (team_id, employee_id)

3. **Orphaned Permissions**
   - Symptoms: Deleted teams leave permissions behind
   - Check: CASCADE delete working properly

4. **Search Not Working**
   - Symptoms: Employee search returns no results
   - Check: Employee name field populated in database

5. **Permission Changes Not Reflecting**
   - Symptoms: User permissions unchanged after team update
   - Solution: User must refresh session or re-login

---

## Success Criteria

### ✅ All Tests Pass When:

- [ ] Can create, edit, delete teams
- [ ] Can add/remove team members with search
- [ ] Can configure all 21 modules × 5 permissions = 105 combinations
- [ ] Permission matrix saves and loads correctly
- [ ] Users in multiple teams get aggregated permissions (OR logic)
- [ ] Middleware blocks unauthorized routes
- [ ] Navigation filters by permissions
- [ ] RLS policies enforce company isolation
- [ ] Default teams exist with correct permissions
- [ ] All database queries use indexes
- [ ] UI is responsive and performant
- [ ] No console errors or warnings
- [ ] TypeScript compiles without errors

---

## Troubleshooting

### If Tests Fail:

1. **Check Browser Console**: Look for errors
2. **Check Server Logs**: `npm run dev` output
3. **Check Database**: Run verification queries
4. **Check Network Tab**: See API responses
5. **Clear Cache**: Refresh page with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
6. **Check Supabase**: RLS policies enabled, tables exist
7. **Verify Environment Variables**: Supabase URL and keys correct

---

## Next Steps After Testing

Once all tests pass:

1. **Production Deployment**:
   - Run migration scripts on production database
   - Deploy updated application code
   - Monitor for errors

2. **User Training**:
   - Train admins on team management
   - Document permission meanings
   - Create team templates

3. **Gradual Migration**:
   - Keep default teams initially
   - Create custom teams gradually
   - Monitor permission usage
   - Eventually remove role field (optional)

---

**Happy Testing!** 🎉
