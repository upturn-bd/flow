# Team-Based Permissions Implementation Progress

## ✅ Completed Tasks

### 1. Analysis & Planning (Tasks 1-3) ✅
- **Studied current role system**: Analyzed middleware.ts, nav-items.ts, path-utils.ts, and AuthContext
- **Mapped all system modules**: Documented 21 modules across 4 categories (Workflow, Services, Operations, Admin)
- **Designed architecture**: Created comprehensive plan for teams, permissions, and granular access control

### 2. Database Layer (Task 4) ✅
**Files Created:**
- `sql/teams_permissions_system.sql` - Core database schema with:
  - `teams` table (company-scoped team definitions)
  - `team_members` table (many-to-many employee-team relationship)
  - `permissions` table (master list of 21 system modules)
  - `team_permissions` table (granular permission matrix)
  - Row Level Security (RLS) policies
  - Helper functions: `get_user_permissions()`, `has_permission()`
  - Indexes for performance optimization

- `sql/migrate_roles_to_teams.sql` - Data migration script with:
  - Auto-creation of 3 default teams per company (Administrators, Managers, Employees)
  - Permission assignment based on existing role patterns
  - User migration from roles to teams
  - Verification queries and rollback support

### 3. Type System (Task 5) ✅
**Updated Files:**
- `src/lib/types/schemas.ts` - Added interfaces:
  - `Team`, `TeamMember`, `TeamPermission`, `Permission`
  - `UserPermissions` (for aggregated permission lookups)
  - `TeamWithMembers`, `TeamWithPermissions` (extended types)
  - `PermissionCategory` type

- `src/lib/constants/index.ts` - Added constants:
  - `PERMISSION_ACTIONS` (READ, WRITE, DELETE, APPROVE, COMMENT)
  - `PERMISSION_MODULES` (all 21 modules)
  - `MODULE_CATEGORIES` (WORKFLOW, SERVICES, OPERATIONS, ADMIN)
  - `MODULE_DISPLAY_NAMES` (human-readable names)
  - `DEFAULT_TEAMS` (system default team names)

### 4. Core Hooks (Tasks 6-7) ✅
**Files Created:**

#### `src/hooks/useTeams.tsx`
Complete team management hook following useEmployees pattern:
- **Fetch Functions:**
  - `fetchTeams()` - Get all company teams
  - `fetchTeamWithMembers()` - Team details with member list
  - `fetchTeamWithPermissions()` - Team with permission matrix
  - `fetchEmployeeTeams()` - Teams for specific employee

- **CRUD Operations:**
  - `createTeam()`, `updateTeam()`, `deleteTeam()`

- **Member Management:**
  - `addTeamMember()`, `removeTeamMember()`, `addTeamMembers()`

- **Permission Management:**
  - `updateTeamPermission()`, `updateTeamPermissions()`

#### `src/hooks/usePermissions.tsx`
Comprehensive permission checking hook:
- **Core Checks:**
  - `hasPermission(module, action)` - Main permission check
  - `canRead()`, `canWrite()`, `canDelete()`, `canApprove()`, `canComment()` - Convenience methods

- **Advanced Checks:**
  - `hasAnyPermission()` - Check if user has any access to module
  - `hasAllPermissions()` - Require multiple permissions
  - `hasAnyOfPermissions()` - Check for any of specified permissions

- **Utility Functions:**
  - `getAccessibleModules()` - List all modules user can access
  - `getModulesWithAction()` - Find modules with specific action
  - `getModulePermissions()` - Get full permission object for module
  - `isAdmin()` - Check admin status
  - `canManageOperations()` - Check operational management access
  - `refreshPermissions()` - Force refresh after changes

- **Additional Hook:** `usePermissionChecks()` - Stateless permission checking for context-provided permissions

## 📊 System Architecture

### Permission Flow
```
User → team_members → teams → team_permissions → permissions
                                     ↓
                           Aggregated User Permissions
                                     ↓
                              Permission Checks
```

### Database Functions
- `get_user_permissions(user_id)` - Aggregates permissions from all user's teams (uses MAX for OR logic)
- `has_permission(user_id, module, action)` - Single permission check

### Module Structure
```
21 Modules across 4 Categories:
├── Workflow (3): Tasks, Projects, Milestones
├── Services (8): Attendance, Leave, Notice, Requisition, Settlement, Complaints, Payroll, Stakeholders
├── Operations (3): Onboarding, Offboarding, HRIS
└── Admin (7): Admin Config, Departments, Divisions, Grades, Positions, Company Logs, Teams
```

### Permission Actions (5 types)
- **READ**: View module data
- **WRITE**: Create/update entries
- **DELETE**: Remove entries
- **APPROVE**: Approve requests/workflows
- **COMMENT**: Add comments/feedback

## 🚀 Next Steps

### Immediate Tasks (Week 1)
1. **Run Database Migrations:**
   ```bash
   # In your database client (Supabase SQL Editor)
   # 1. Run: sql/teams_permissions_system.sql
   # 2. Run: sql/migrate_roles_to_teams.sql
   # 3. Verify: SELECT * FROM migration_report;
   ```

2. **Test Hooks:**
   - Create test component to verify useTeams and usePermissions
   - Test permission aggregation across multiple teams
   - Verify RLS policies work correctly

### Phase 2 (Week 2): Admin UI - Task 8
Build team management interface:
- `src/components/admin-management/teams/TeamManagement.tsx`
- `src/components/admin-management/teams/TeamForm.tsx`
- `src/components/admin-management/teams/TeamPermissionsConfig.tsx`
- `src/components/admin-management/teams/TeamMembersList.tsx`
- Add route to admin-management navigation

### Phase 3 (Week 3): Core System Updates - Tasks 9-11
1. **Update Middleware** (`src/middleware.ts`):
   - Replace role checks with permission queries
   - Use `get_user_permissions()` function
   - Cache permissions for performance

2. **Update AuthProvider** (`src/lib/auth/auth-context.tsx`):
   - Integrate usePermissions hook
   - Replace role-based nav filtering
   - Provide permission context to app

3. **Update Navigation** (`src/app/(home)/nav-items.ts`):
   - Replace `roles` array with `requiredPermissions`
   - Support multiple modules per nav item

### Phase 4 (Week 4): Hook Updates - Task 12
Update domain hooks to use permissions:
- `useProjects.tsx` - Check write/delete permissions
- `useTasks.tsx` - Check write/comment permissions
- `useLeaveManagement.tsx` - Check approve permissions
- `useAttendanceManagement.tsx` - Check write permissions
- `useRequisition.tsx` - Check approve permissions
- And 10+ more hooks...

### Phase 5 (Week 5): Component Updates - Task 14
- Convert `RoleManagementTab` to `TeamManagementTab`
- Update all components using role checks
- Add permission-based UI rendering

### Phase 6 (Week 6): Testing - Task 15
- Unit tests for permission logic
- Integration tests for middleware
- E2E tests for critical workflows
- Performance testing for permission queries

## 📝 Migration Strategy

### Default Team Permissions

**Administrators** - Full access:
- All 21 modules with all 5 actions enabled

**Managers** - Supervisory access:
- Read: All modules
- Write: Workflow + Services + Operations (14 modules)
- Delete: Workflow + Notice (4 modules)
- Approve: Leave, Requisition, Settlement, Complaints, Onboarding (5 modules)
- Comment: Workflow + Services + Operations (14 modules)

**Employees** - Standard access:
- Read: Workflow + Services + own HRIS (11 modules)
- Write: Tasks, Attendance, Leave, Requisition, Settlement, Complaints (6 modules)
- Delete: Tasks only (1 module)
- Approve: None
- Comment: Workflow modules (3 modules)

### Backward Compatibility
- `role` column kept in employees table temporarily
- Both role and permission checks during transition
- Gradual deprecation of role-based code
- Full removal after testing phase

## 🎯 Key Benefits

1. **Flexibility**: Create custom teams beyond Admin/Manager/Employee
2. **Granularity**: Control at module + action level (105 possible combinations)
3. **Scalability**: Easy to add new modules and permissions
4. **Multi-team Support**: Users can belong to multiple teams with aggregated permissions
5. **Audit Trail**: Track who added users to teams and when
6. **Company Isolation**: Teams are scoped per company
7. **Performance**: Optimized with database functions and indexes

## 📚 Documentation Created

1. `PERMISSIONS_MIGRATION_PLAN.md` - Comprehensive migration plan
2. `sql/teams_permissions_system.sql` - Database schema with inline comments
3. `sql/migrate_roles_to_teams.sql` - Migration script with documentation
4. This progress report

## ⚠️ Important Notes

- **Backup First**: Always backup database before running migrations
- **Test in Development**: Run migrations in dev environment first
- **Monitor Performance**: Watch for slow permission queries
- **Rollback Ready**: Migration includes rollback scripts
- **RLS Enabled**: Row Level Security protects all tables
- **Company Scoped**: All teams are isolated by company_id

## 🔧 How to Use the New System

### For Developers
```typescript
// Check permission
const { canWrite, canApprove } = usePermissions();
if (canWrite('tasks')) {
  // Show create task button
}

// Check specific permission
if (hasPermission('leave', 'can_approve')) {
  // Show approve button
}

// Get all accessible modules
const modules = getAccessibleModules();
```

### For Admins
1. Navigate to Admin Management → Team Management
2. Create new team with custom permissions
3. Add employees to team
4. Configure granular permissions per module

---

**Status**: Phase 1 Complete (Database + Types + Hooks)  
**Next**: Run database migrations and begin Phase 2 (Admin UI)  
**Timeline**: On track for 6-week rollout plan
