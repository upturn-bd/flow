# Theme Migration Tracker

**Date Started**: November 25, 2025  
**Default Theme**: Light mode ✅  
**Icon Migration**: Complete (Phosphor Icons) ✅

---

## Migration Status Overview

- [ ] **Auth Pages** (4 files) - PRIORITY 1
- [ ] **Layout Components** (3 files) - PRIORITY 1
- [ ] **Stakeholder Process Components** (4 files) - PRIORITY 2
- [ ] **Stakeholder Components** (4 files) - PRIORITY 2
- [ ] **Admin Components** (30+ files) - PRIORITY 3
- [ ] **Operations Components** (4 files) - PRIORITY 3
- [ ] **Other Components** (5+ files) - PRIORITY 4

---

## Detailed Progress

### 🔴 PRIORITY 1: Auth Pages (User First Impression) ✅ COMPLETE

- [x] `src/app/(auth)/login/page.tsx` - 10+ instances ✅
- [x] `src/app/(auth)/signup/page.tsx` - 10+ instances ✅
- [x] `src/app/(auth)/verify/VerifyClient.tsx` - Multiple instances ✅
- [x] `src/app/(auth)/forgot-password/page.tsx` - Multiple instances ✅

### 🔴 PRIORITY 1: Layout Components (Every Page) ✅ COMPLETE

- [x] `src/app/(home)/side-navbar.tsx` - 10+ instances ✅
- [x] `src/app/(home)/top-bar.tsx` - 20+ instances ✅
- [x] `src/app/(home)/profile/page.tsx` - 10+ instances ✅

### 🟡 PRIORITY 1.5: Main Dashboard Pages ✅ COMPLETE

- [x] `src/app/(home)/admin/page.tsx` - Admin Management Dashboard ✅
- [x] `src/app/(home)/ops/page.tsx` - Operations & Services Dashboard ✅
- [x] `src/app/(home)/home/components/WidgetCustomizationPanel.tsx` - Widget customization ✅
- [x] `src/app/(home)/home/components/SectionHeader.tsx` - Already theme-aware ✅

### 🟢 PRIORITY 1.6: Widget Components ✅ COMPLETE

- [x] `src/app/(home)/home/widgets/AttendanceWidget.tsx` - Backgrounds, borders ✅
- [x] `src/app/(home)/home/widgets/NoticesWidget.tsx` - Backgrounds, borders ✅
- [x] `src/app/(home)/home/widgets/ProjectsWidget.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/widgets/TasksWidget.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/widgets/StakeholderIssuesWidget.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/widgets/ServicesWidget.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/widgets/StakeholderIssueModal.tsx` - Complete modal migration ✅
- [x] `src/app/(home)/home/widgets/BaseWidget.tsx` - Already theme-aware ✅

### 🟢 PRIORITY 1.7: Widget Section Components ✅ COMPLETE

- [x] `src/app/(home)/home/components/AttendanceSection.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/components/NoticesSection.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/components/TaskListSection.tsx` - All colors migrated ✅
- [x] `src/app/(home)/home/components/SectionHeader.tsx` - Already theme-aware ✅
- [x] `src/app/(home)/home/components/LoadingSection.tsx` - Already theme-aware ✅
- [x] `src/app/(home)/home/components/EmptyState.tsx` - Already theme-aware ✅

### 🟢 PRIORITY 1.8: Admin & Ops Sub-Pages ✅ COMPLETE

#### Admin Pages
- [x] `src/app/(home)/admin/config/basic/page.tsx` - Headings ✅
- [x] `src/app/(home)/admin/transaction/page.tsx` - Headings ✅
- [x] `src/app/(home)/admin/logs/layout.tsx` - Breadcrumbs ✅
- [x] `src/app/(home)/admin/logs/tasks/page.tsx` - All colors ✅
- [x] `src/app/(home)/admin/logs/complaint/page.tsx` - All colors ✅

#### Ops Pages
- [x] `src/app/(home)/ops/tasks/TaskLayout.tsx` - All colors ✅
- [x] `src/app/(home)/ops/requisition/page.tsx` - Tab colors ✅
- [x] `src/app/(home)/ops/payroll/page.tsx` - Tab colors ✅
- [x] `src/app/(home)/ops/settlement/page.tsx` - Tab colors ✅

### 🟡 PRIORITY 2: Stakeholder Process Components (Core Business) - COMPLETE ✅

- [x] `src/components/stakeholder-processes/StepDataForm.tsx` - 94 instances ✅
- [x] `src/components/stakeholder-processes/ProcessForm.tsx` - 22 instances ✅
- [x] `src/components/stakeholder-processes/StepManager.tsx` - 60+ instances ✅
- [x] `src/components/stakeholder-processes/FormulaEditor.tsx` - 20 instances ✅

### 🟡 PRIORITY 2: Stakeholder Components - COMPLETE ✅

- [x] `src/components/stakeholders/StakeholderTransactions.tsx` - 50+ instances ✅
- [x] `src/components/stakeholders/AdditionalDataModal.tsx` - Multiple instances ✅
- [x] `src/components/stakeholder-issues/StakeholderIssuesTab.tsx` - 20+ instances ✅
- [x] `src/components/stakeholder-issues/StakeholderIssueForm.tsx` - 15+ instances ✅

### 🟢 PRIORITY 3: Admin Components - IN PROGRESS

#### Admin Core - COMPLETE ✅
- [x] `src/components/admin/CollapsibleComponent.tsx` - 10+ instances ✅
- [x] `src/components/admin/CompanySettingsConfigView.tsx` - Multiple instances ✅
- [x] `src/components/admin/CompanyBasicsConfigView.tsx` - Multiple instances ✅

#### Admin Teams - COMPLETE ✅
- [x] `src/components/admin/teams/TeamMembersModal.tsx` - 30+ instances ✅
- [x] `src/components/admin/teams/TeamPermissionsModal.tsx` - 20+ instances ✅
- [x] `src/components/admin/teams/TeamForm.tsx` - Multiple instances ✅

#### Admin Grades & Positions - IN PROGRESS
- [x] `src/components/admin/grades/GradesSection.tsx` - 10+ instances ✅
- [ ] `src/components/admin/grades/GradeModal.tsx` - Multiple instances
- [ ] `src/components/admin/positions/PositionsSection.tsx` - Multiple instances
- [ ] `src/components/admin/positions/PositionModal.tsx` - Multiple instances
- [ ] `src/components/admin/positions/PositionDetailsModal.tsx` - Multiple instances

#### Admin Departments & Divisions - IN PROGRESS
- [x] `src/components/admin/departments/DepartmentsSection.tsx` - Multiple instances ✅
- [ ] `src/components/admin/departments/DepartmentDetailsModal.tsx` - Multiple instances
- [ ] `src/components/admin/departments/DepartmentModal.tsx` - Multiple instances
- [ ] `src/components/admin/divisions/DivisionDetailsModal.tsx` - Multiple instances
- [ ] `src/components/admin/divisions/DivisionModal.tsx` - Multiple instances

#### Admin Tabs - IN PROGRESS
- [x] `src/components/admin/tabs/BasicTab.tsx` - Multiple instances ✅
- [ ] `src/components/admin/tabs/RoleManagementTab.tsx` - Multiple instances
- [ ] `src/components/admin/tabs/AccountsTab.tsx` - 30+ instances

#### Admin Tabs
- [ ] `src/components/admin/tabs/BasicTab.tsx` - Multiple instances
- [ ] `src/components/admin/tabs/RoleManagementTab.tsx` - Multiple instances
- [ ] `src/components/admin/tabs/AccountsTab.tsx` - 30+ instances

#### Admin Supervisor & Settlement
- [ ] `src/components/admin/supervisor-lineage/SupervisorLineageView.tsx` - Multiple instances
- [ ] `src/components/admin/supervisor-lineage/SupervisorLineageModal.tsx` - Multiple instances
- [ ] `src/components/admin/supervisor-lineage/SupervisorLineageCreateModal.tsx` - Multiple instances
- [ ] `src/components/admin/supervisor-lineage/SupervisorLineageUpdateModal.tsx` - Multiple instances
- [ ] `src/components/admin/settlement/SettlementView.tsx` - Multiple instances
- [ ] `src/components/admin/settlement/SettlementTable.tsx` - Multiple instances
- [ ] `src/components/admin/settlement/ClaimTypeCreateModal.tsx` - Multiple instances
- [ ] `src/components/admin/settlement/ClaimTypeUpdateModal.tsx` - Multiple instances

#### Admin Leave & Attendance
- [ ] `src/components/admin/leave/LeaveManagementView.tsx` - 15+ instances
- [ ] `src/components/admin/leave/LeaveTypeCreateModal.tsx` - Multiple instances
- [ ] `src/components/admin/leave/LeaveTypeUpdateModal.tsx` - Multiple instances
- [ ] `src/components/admin/leave/LeaveHolidayCreateModal.tsx` - Multiple instances
- [ ] `src/components/admin/leave/LeaveHolidayUpdateModal.tsx` - Multiple instances
- [ ] `src/components/admin/attendance/AttendanceModal.tsx` - Multiple instances
- [ ] `src/components/admin/attendance/AttendanceCreateModal.tsx` - Multiple instances
- [ ] `src/components/admin/attendance/AttendanceUpdateModal.tsx` - Multiple instances

#### Admin Other
- [ ] `src/components/admin/salary/SalaryManagement.tsx` - 15+ instances
- [ ] `src/components/admin/notice/NoticeManagementView.tsx` - Multiple instances
- [ ] `src/components/admin/notice/NoticeModal.tsx` - Multiple instances
- [ ] `src/components/admin/complaints/ComplaintsModal.tsx` - Multiple instances
- [ ] `src/components/admin/complaints/ComplaintsTable.tsx` - Multiple instances
- [ ] `src/components/admin/stakeholder-types/StakeholderTypeManagementView.tsx` - Multiple instances
- [ ] `src/components/admin/stakeholder-types/StakeholderTypeFormModal.tsx` - Multiple instances
- [ ] `src/components/admin/inventory/RequisitionTypeModal.tsx` - Multiple instances
- [ ] `src/components/admin/inventory/RequisitionInventoryCreateModal.tsx` - Multiple instances
- [ ] `src/components/admin/inventory/RequisitionInventoryUpdateModal.tsx` - Multiple instances
- [ ] `src/components/admin/setup/SetupStep1.tsx` - Multiple instances
- [ ] `src/components/admin/setup/SetupStep2.tsx` - Multiple instances

### 🟢 PRIORITY 3: Operations Components

- [ ] `src/components/ops/tasks/OngoingTasks.tsx` - Multiple instances
- [ ] `src/components/ops/tasks/CompletedTasks.tsx` - Multiple instances
- [ ] `src/components/ops/settlement/UpcomingPage.tsx` - Multiple instances
- [ ] `src/components/ops/settlement/SettlementRequestsPage.tsx` - Multiple instances
- [ ] `src/app/(home)/ops/project/ProjectLayout.tsx` - Multiple instances

### 🔵 PRIORITY 4: Other Components

- [ ] `src/components/education-and-experience/EducationModal.tsx` - Multiple instances
- [ ] `src/components/education-and-experience/ExperienceModal.tsx` - Multiple instances
- [ ] `src/components/permissions/PermissionTooltip.tsx` - Multiple instances
- [ ] `src/components/permissions/PermissionBadge.tsx` - Hardcoded semantic colors
- [ ] `src/app/unauthorized/page.tsx` - Hardcoded colors

---

## Migration Rules

### Color Mappings

#### Background Colors
- `bg-white` → `bg-surface-primary`
- `bg-gray-50` → `bg-background-secondary`
- `bg-gray-100` → `bg-background-tertiary`
- `bg-gray-200` → `bg-surface-secondary`
- `bg-black` → Use theme-aware approach

#### Text Colors
- `text-gray-900` → `text-foreground-primary`
- `text-gray-800` → `text-foreground-primary`
- `text-gray-700` → `text-foreground-secondary`
- `text-gray-600` → `text-foreground-tertiary`
- `text-gray-500` → `text-foreground-tertiary`
- `text-white` → `text-white` (keep for specific contrast needs)
- `text-black` → `text-foreground-primary`

#### Border Colors
- `border-gray-100` → `border-border-primary`
- `border-gray-200` → `border-border-primary`
- `border-gray-300` → `border-border-secondary`

#### Primary Colors
- `bg-blue-*` → `bg-primary-*`
- `text-blue-*` → `text-primary-*`
- `border-blue-*` → `border-primary-*`

#### Semantic Colors (Keep for specific states)
- Error states: `bg-red-*`, `text-red-*` → Can use `text-error`, `bg-error` where appropriate
- Success states: `bg-green-*`, `text-green-*` → Can use `text-success`, `bg-success`
- Warning states: `bg-yellow-*`, `text-yellow-*` → Can use `text-warning`, `bg-warning`
- Info states: `bg-blue-*`, `text-blue-*` → Can use `text-info`, `bg-info`

### Dark Mode Support
- Add `dark:` variants where needed for proper dark mode support
- Test in both light and dark modes after migration

---

## Notes

- Default theme is already set to 'light' ✅
- All icons already migrated to Phosphor ✅
- Focus on maintaining visual consistency
- Test each component after migration
- Components using `BaseModal`, `Button`, `Card`, `FormInputField`, `FormSelectField` already follow theming system
