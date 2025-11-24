# Context Migration Tracker

## Overview
This file tracks the migration from hook-based data management to context-based architecture.

## Migration Status

### Contexts Created
- [x] EmployeesContext
- [x] DepartmentsContext
- [x] DivisionsContext
- [x] TeamsContext
- [x] PositionsContext
- [x] GradesContext

### Hooks Deprecated
- [x] useEmployees.tsx → EmployeesContext (12 files migrated)
- [x] useDepartments.tsx → DepartmentsContext (7 files migrated)
- [x] useTeams.tsx → TeamsContext (1 file migrated)
- [ ] useDivisions.tsx → DivisionsContext
- [ ] usePositions.tsx → PositionsContext
- [ ] useGrades.tsx → GradesContext

### Files Migrated

#### Admin Pages
- [x] src/app/(home)/admin/data-export/page.tsx (useEmployees → useEmployeesContext)
- [x] src/app/(home)/admin/stakeholders/new/page.tsx (useEmployees → useEmployeesContext)
- [x] src/app/(home)/admin/stakeholders/[id]/edit/page.tsx (useEmployees → useEmployeesContext)
- [x] src/app/(home)/admin/stakeholders/[id]/page.tsx (useTeams → useTeamsContext)
- [x] src/app/(home)/admin/logs/complaint/page.tsx (useEmployees → useEmployeesContext)
- [ ] src/app/(home)/admin/config/teams/page.tsx (needs advanced team methods)

#### HRIS Pages
- [x] src/app/(home)/hris/tabs/BasicInfoTab.tsx (useDepartments → useDepartmentsContext)

#### Profile Pages
- [x] src/app/(home)/profile/tabs/BasicInfoTab.tsx (useDepartments → useDepartmentsContext)

#### Onboarding/Offboarding Pages
- [x] src/app/(home)/ops/onboarding/page.tsx (useEmployees, useDepartments → contexts)
- [x] src/app/(home)/onboarding/onboarding.tsx (useEmployees, useDepartments → contexts)
- [x] src/app/(home)/ops/offboarding/page.tsx (useDepartments → useDepartmentsContext)

#### Operations Pages
- [x] src/app/(home)/ops/hris/page.tsx (useEmployees → useEmployeesContext)
- [x] src/app/(home)/ops/project/[id]/page.tsx (useEmployees, useDepartments → contexts)

#### Finder Page
- [x] src/app/(home)/finder/page.tsx (useEmployees → useEmployeesContext)

#### Components
- [ ] Search usage of each hook across all components
- [ ] Update imports systematically

## Notes
- Keep AdminDataContext until all migrations complete
- Test each migration thoroughly before proceeding
- Ensure optimistic updates work correctly
- Verify error handling and rollback
