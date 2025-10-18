# Team-Based Permissions System Migration Plan

## Executive Summary

This document outlines the migration from a fixed 3-role system (Admin, Manager, Employee) to a flexible team-based permissions system with granular module-level access control.

## Current System Analysis

### Current Role System
- **3 Fixed Roles**: Admin, Manager, Employee
- **Implementation Points**:
  - `src/middleware.ts`: Role-based route protection
  - `src/lib/utils/path-utils.ts`: Route arrays per role
  - `src/app/(home)/nav-items.ts`: Navigation filtered by roles array
  - `src/lib/auth/auth-context.tsx`: Role-based nav filtering
  - `employees` table: `role` column (varchar)

### System Modules Identified

#### Workflow Modules
1. **Tasks** - Task management and tracking
2. **Projects** - Project planning and execution
3. **Milestones** - Project milestone tracking

#### Services Modules
4. **Attendance** - Check-in/check-out tracking
5. **Leave** - Leave application and approval
6. **Notice** - Company announcements
7. **Requisition** - Asset/resource requests
8. **Settlement** - Expense claims and settlements
9. **Complaints** - Workplace complaint management
10. **Payroll** - Salary and payroll information
11. **Stakeholders** - External stakeholder management

#### Operations Modules
12. **Onboarding** - New employee onboarding
13. **Offboarding** - Employee exit process
14. **HRIS** - Employee information management

#### Admin Modules
15. **Admin Configurations** - Company settings
16. **Departments** - Department management
17. **Divisions** - Division management
18. **Grades** - Grade/level management
19. **Positions** - Position/role management
20. **Company Logs** - System audit trails

### Permission Types per Module

- **READ**: View module data
- **WRITE**: Create/update entries
- **DELETE**: Remove entries
- **APPROVE**: Approve requests (for approval-based modules)
- **COMMENT**: Add comments/feedback

## New Architecture Design

### Database Schema

#### 1. Teams Table
```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  UNIQUE(name, company_id)
);
```

#### 2. Team Members Table
```sql
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES employees(id),
  UNIQUE(team_id, employee_id)
);
```

#### 3. Permissions Table (Reference)
```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL -- 'workflow', 'services', 'operations', 'admin'
);
```

#### 4. Team Permissions Table
```sql
CREATE TABLE team_permissions (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  can_read BOOLEAN DEFAULT FALSE,
  can_write BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_approve BOOLEAN DEFAULT FALSE,
  can_comment BOOLEAN DEFAULT FALSE,
  UNIQUE(team_id, permission_id)
);
```

### TypeScript Types

```typescript
// src/lib/types/schemas.ts additions

export interface Team {
  id?: number;
  name: string;
  description?: string;
  company_id: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface TeamMember {
  id?: number;
  team_id: number;
  employee_id: string;
  joined_at?: string;
  added_by?: string;
}

export interface Permission {
  id?: number;
  module_name: string;
  display_name: string;
  description?: string;
  category: 'workflow' | 'services' | 'operations' | 'admin';
}

export interface TeamPermission {
  id?: number;
  team_id: number;
  permission_id: number;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_comment: boolean;
}

export interface UserPermissions {
  [moduleName: string]: {
    can_read: boolean;
    can_write: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_comment: boolean;
  };
}
```

### Constants

```typescript
// src/lib/constants/index.ts additions

export const PERMISSION_ACTIONS = {
  READ: 'can_read',
  WRITE: 'can_write',
  DELETE: 'can_delete',
  APPROVE: 'can_approve',
  COMMENT: 'can_comment',
} as const;

export const PERMISSION_MODULES = {
  // Workflow
  TASKS: 'tasks',
  PROJECTS: 'projects',
  MILESTONES: 'milestones',
  
  // Services
  ATTENDANCE: 'attendance',
  LEAVE: 'leave',
  NOTICE: 'notice',
  REQUISITION: 'requisition',
  SETTLEMENT: 'settlement',
  COMPLAINTS: 'complaints',
  PAYROLL: 'payroll',
  STAKEHOLDERS: 'stakeholders',
  
  // Operations
  ONBOARDING: 'onboarding',
  OFFBOARDING: 'offboarding',
  HRIS: 'hris',
  
  // Admin
  ADMIN_CONFIG: 'admin_config',
  DEPARTMENTS: 'departments',
  DIVISIONS: 'divisions',
  GRADES: 'grades',
  POSITIONS: 'positions',
  COMPANY_LOGS: 'company_logs',
} as const;

export const MODULE_CATEGORIES = {
  WORKFLOW: 'workflow',
  SERVICES: 'services',
  OPERATIONS: 'operations',
  ADMIN: 'admin',
} as const;
```

## Implementation Plan

### Phase 1: Database & Types (Tasks 4-5)

1. Create database migration SQL files:
   - `sql/teams_system.sql`
   - Seed default permissions data
   
2. Update TypeScript definitions:
   - Add interfaces to `schemas.ts`
   - Add constants to `constants/index.ts`

### Phase 2: Core Hooks (Tasks 6-7)

1. Create `src/hooks/useTeams.tsx`:
   - Follow `useEmployees` pattern
   - CRUD operations for teams
   - Team member management
   - Company-scoped queries

2. Create `src/hooks/usePermissions.tsx`:
   - Fetch user's aggregated permissions from all teams
   - Cache permission checks
   - Convenience methods: `hasPermission(module, action)`
   - Permission loading state

### Phase 3: Admin UI (Task 8)

1. Create Team Management page:
   - `src/components/admin-management/teams/TeamManagement.tsx`
   - `src/components/admin-management/teams/TeamForm.tsx`
   - `src/components/admin-management/teams/TeamPermissionsConfig.tsx`
   - `src/components/admin-management/teams/TeamMembersList.tsx`
   - Use CollapsibleComponent pattern
   - Add to admin-management navigation

### Phase 4: Middleware & Context Updates (Tasks 9-11)

1. Update `src/middleware.ts`:
   - Replace role-based checks with permission queries
   - Cache user permissions in middleware
   - Dynamic route protection based on module permissions

2. Update `src/lib/auth/auth-context.tsx`:
   - Replace role-based nav filtering
   - Add `usePermissions` hook integration
   - Provide permission context to children

3. Update `src/app/(home)/nav-items.ts`:
   - Replace `roles` array with `requiredPermissions`
   - Support multiple modules per nav item

### Phase 5: Hook Updates (Task 12)

Update all domain hooks to use permissions:
- `useProjects.tsx`
- `useTasks.tsx`
- `useLeaveManagement.tsx`
- `useAttendanceManagement.tsx`
- `useRequisition.tsx`
- `useSettlement.tsx`
- `useComplaints.tsx`
- `useOnboarding.tsx`
- `useOffboarding.tsx`
- etc.

### Phase 6: Data Migration (Task 13)

1. Create migration script:
   - Create default teams: "Administrators", "Managers", "Employees"
   - Map existing roles to team memberships
   - Assign appropriate permissions to default teams
   - Deprecate (but keep) `role` column for rollback

2. Create rollback strategy

### Phase 7: Component Updates (Task 14)

1. Convert `RoleManagementTab` to `TeamManagementTab`:
   - Team assignment instead of role assignment
   - Multi-team support
   - Permission preview

### Phase 8: Testing (Task 15)

1. Test permission checks across all modules
2. Test middleware route protection
3. Test UI permission-based rendering
4. Test team CRUD operations
5. Test data migration

## Migration Strategy

### Backward Compatibility

1. Keep `role` column in `employees` table temporarily
2. During transition, check both role and permissions
3. Gradually deprecate role-based checks
4. Remove role column after full migration and testing

### Default Teams Setup

**Administrators Team**:
- All permissions with all actions enabled
- Auto-assign existing Admin role users

**Managers Team**:
- Read/Write/Comment on all workflow and services modules
- Read-only on admin modules
- Approve permissions for leave, requisition, settlement, complaints
- Auto-assign existing Manager role users

**Employees Team**:
- Read/Write/Comment on tasks, attendance, leave, requisition, settlement, complaints
- Read-only on projects, milestones, notice, payroll
- No admin module access
- Auto-assign existing Employee role users

### Rollout Plan

1. **Week 1**: Database schema + types + core hooks
2. **Week 2**: Admin UI for team management
3. **Week 3**: Middleware and context updates
4. **Week 4**: Hook updates and component refactoring
5. **Week 5**: Data migration and testing
6. **Week 6**: Deployment and monitoring

## Benefits of New System

1. **Flexibility**: Create custom teams with specific permission sets
2. **Granularity**: Control access at module + action level
3. **Scalability**: Easy to add new modules and permissions
4. **Multi-team**: Users can belong to multiple teams with aggregated permissions
5. **Audit Trail**: Track who added users to teams and when
6. **Company-scoped**: Teams are isolated per company

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Performance degradation from permission queries | Implement caching layer, optimize SQL queries with indexes |
| Complex permission resolution logic | Comprehensive unit tests, clear documentation |
| Data migration failures | Rollback scripts, keep old role column, phased rollout |
| User confusion during transition | Admin training, clear UI indicators, gradual feature release |

## Success Metrics

- Zero downtime during migration
- All existing users maintain current access levels
- Admin can create custom teams within 5 minutes
- Permission checks add <100ms to route load times
- 100% test coverage for permission logic

---

**Document Version**: 1.0  
**Last Updated**: October 16, 2025  
**Status**: Planning Phase
