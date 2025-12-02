# UI Componentization Progress Tracker

## Overview
This document tracks the progress of componentizing duplicated UI patterns across the Flow HRIS codebase.

## Summary

**Components Created:** 12 new reusable components (including SuperadminFormModal, InlineDeleteConfirm, InlineSpinner)
**Files Refactored:** 60+ files across admin, superadmin, and home pages
**Status:** Primary refactoring complete! All spinner patterns componentized ✅
**Remaining:** Page headers, empty states, confirmation modals, badge standardization

---

## ✅ Component Type Improvements

The following components were updated to properly handle Phosphor icon types:

### Icon Handling Pattern
All these components now accept both `ComponentType` and `ReactNode` for icon props:
- **StatCard** - Added `IconWeight` type, `iconColor`, `iconBgColor`, `title` props
- **PageHeader** - Added `IconWeight` type, `iconColor` prop, `gradient` variant
- **EmptyState** - Added `IconWeight` type, improved `renderIcon` helper

This allows both patterns:
```tsx
// Pass component reference (recommended)
<StatCard icon={Buildings} value={10} label="Total" />

// Pass rendered element
<StatCard icon={<Buildings size={24} />} value={10} label="Total" />
```

---

## ⚠️ Common Pitfalls & Guidelines

### 1. Icon Component Handling (ForwardRef)
**Problem:** Passing Phosphor icons as `icon={IconName}` caused "Objects are not valid as a React child" error.

**Root Cause:** Phosphor icons are `ForwardRefExoticComponent` - `typeof icon === 'function'` returns `false` for them.

**Solution:** Check for both function components AND ForwardRef components:
```tsx
function renderIcon(icon: ComponentType | ReactNode, size: number): ReactNode {
  if (isValidElement(icon)) return icon;
  
  // Handle both function components AND ForwardRef components
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in icon)) {
    const IconComponent = icon as ComponentType<{ size?: number; weight?: IconWeight }>;
    return <IconComponent size={size} weight="duotone" />;
  }
  
  return icon;
}
```

### 2. Refs vs State for Loading (Re-render Issue)
**Problem:** Using `useRef` for loading state that controls rendering caused infinite loading.

**Root Cause:** Ref changes don't trigger re-renders, so `!hasLoadedRef.current` in JSX never updates.

**Bad Pattern:**
```tsx
const hasLoadedRef = useRef(false);
// This will NEVER re-render when hasLoadedRef.current changes!
{(loading || !hasLoadedRef.current) ? <LoadingSpinner /> : <Content />}
```

**Good Pattern:**
```tsx
const [hasLoaded, setHasLoaded] = useState(false);
useEffect(() => {
  if (!loading && !hasLoaded) setHasLoaded(true);
}, [loading, hasLoaded]);
// This WILL re-render when hasLoaded changes
{loading ? <LoadingSpinner /> : <Content />}
```

### 3. Section Component Props
**Problem:** Using incorrect prop names from old patterns.

**Correct Props:**
```tsx
<Section
  title="Title"
  description="Description"
  icon={<Icon size={20} weight="duotone" />}  // ReactNode, not component
  loading={isLoading}                          // NOT isLoading
  loadingIcon={IconComponent}                  // Component reference for LoadingSpinner
  loadingText="Loading..."
  emptyState={{                                // Object, NOT isEmpty/emptyText
    show: items.length === 0,
    icon: <Icon size={32} />,
    message: "No items found",
    action: { label: "Add", onClick: handleAdd }
  }}
  addButton={{ onClick: handleAdd }}           // NOT onAdd
>
```

---

## 🟢 Completed Components

### New Components Created
- [x] `SearchBar` - `/src/components/ui/SearchBar.tsx` - Search input with icon and clear button
- [x] `StatCard` - `/src/components/ui/StatCard.tsx` - Dashboard stat card with icon and value
- [x] `PageHeader` - `/src/components/ui/PageHeader.tsx` - Page header with title, description, actions
- [x] `Section` - `/src/components/ui/Section.tsx` - Section wrapper with header, loading, empty state
- [x] `EntityListItem` - `/src/components/ui/EntityListItem.tsx` - List item for vertical lists
- [x] `EntityCard` - `/src/components/ui/EntityCard.tsx` - Card for grid-based entity displays
- [x] `DataTable` - `/src/components/ui/DataTable.tsx` - Reusable data table component
- [x] `Badge` - `/src/components/ui/Badge.tsx` - Status, Priority, Role badges
- [x] `EmptyState` - `/src/components/ui/EmptyState.tsx` - Updated to accept IconType directly
- [x] `SuperadminFormModal` - `/src/components/ui/modals/SuperadminFormModal.tsx` - Themed form modal with gradient header
- [x] `InlineDeleteConfirm` - `/src/components/ui/InlineDeleteConfirm.tsx` - Inline delete confirmation buttons
- [x] `InlineSpinner` - `/src/components/ui/InlineSpinner.tsx` - Lightweight inline loading spinner

### Existing Components (Need Wider Adoption)
- [x] `Card` - `/src/components/ui/Card.tsx`
- [x] `BaseModal` - `/src/components/ui/modals/BaseModal.tsx`
- [x] `LoadingSpinner` - `/src/components/ui/LoadingSpinner.tsx`
- [x] `StatusBadge` - In `/src/components/ui/Card.tsx`
- [x] `PriorityBadge` - In `/src/components/ui/Card.tsx`

## 🟢 Refactored Files (Completed)

### Admin Section Components (8 files)
- [x] `src/components/admin/divisions/DivisionsSection.tsx` - Using Section, EntityListItem
- [x] `src/components/admin/departments/DepartmentsSection.tsx` - Using Section, EntityListItem
- [x] `src/components/admin/positions/PositionsSection.tsx` - Using Section, EntityListItem
- [x] `src/components/admin/grades/GradesSection.tsx` - Using Section
- [x] `src/components/admin/settlement/SettlementView.tsx` - Using EntityCard, EntityCardGrid, EmptyState
- [x] `src/components/admin/inventory/InventoryManagementView.tsx` - Using EntityCard, EntityCardGrid, EmptyState
- [x] `src/components/admin/attendance/AttendanceManagementView.tsx` - Using EntityCard, EntityCardMetaItem, EmptyState
- [x] `src/components/admin/leave/LeaveManagementView.tsx` - Using EntityCard, EntityCardBadge, EntityCardMetaItem, EmptyState

### Superadmin Pages (6 files)
- [x] `src/app/(superadmin)/sa/page.tsx` - Using StatCard, EmptyState
- [x] `src/app/(superadmin)/sa/countries/page.tsx` - Using PageHeader, SearchBar, StatCard, EmptyState
- [x] `src/app/(superadmin)/sa/industries/page.tsx` - Using PageHeader, SearchBar, StatCard, EmptyState
- [x] `src/app/(superadmin)/sa/companies/page.tsx` - Using PageHeader, SearchBar, StatCard, EmptyState
- [x] `src/app/(superadmin)/sa/users/page.tsx` - Using PageHeader, StatCard, EmptyState
- [x] `src/app/(superadmin)/sa/teams/page.tsx` - Using PageHeader, EmptyState

### Home Pages (4 files)
- [x] `src/app/(home)/admin/page.tsx` - Using SearchBar, EmptyState, PageHeader
- [x] `src/app/(home)/ops/page.tsx` - Using SearchBar, EmptyState, PageHeader
- [x] `src/app/(home)/admin/stakeholders/page.tsx` - Using PageHeader, SearchBar, StatCard
- [x] `src/app/(home)/ops/stakeholder-issues/page.tsx` - Using PageHeader, SearchBar, StatCard

### Recently Refactored (Dec 2024)
- [x] `src/app/(home)/finder/page.tsx` - Using PageHeader, SearchBar, EmptyState, LoadingSpinner
- [x] `src/app/(home)/hris/page.tsx` - Using LoadingSpinner
- [x] `src/app/(home)/notifications/page.tsx` - Using PageHeader
- [x] `src/app/(home)/ops/onboarding/page.tsx` - Using EmptyState
- [x] `src/app/(home)/ops/offboarding/page.tsx` - Using SearchBar, EmptyState
- [x] `src/app/(home)/ops/notice/page.tsx` - Using PageHeader, EmptyState
- [x] `src/app/(home)/admin/config/teams/page.tsx` - Using SearchBar, LoadingSpinner
- [x] `src/app/(home)/admin/stakeholders/[id]/page.tsx` - Using LoadingSpinner, EmptyState
- [x] `src/components/ops/settlement/UpcomingPage.tsx` - Using LoadingSpinner, EmptyState
- [x] `src/components/ops/requisition/UpcomingPage.tsx` - Using LoadingSpinner, EmptyState
- [x] `src/components/notifications/NotificationDropdown.tsx` - Using InlineSpinner
- [x] `src/app/(home)/profile/page.tsx` - Using PageHeader, LoadingSpinner
- [x] `src/app/(home)/ops/hris/page.tsx` - Using PageHeader, SearchBar, LoadingSpinner, EmptyState
- [x] `src/app/(home)/admin/data-export/page.tsx` - Using InlineSpinner
- [x] `src/app/(home)/admin/logs/tasks/page.tsx` - Using InlineSpinner
- [x] `src/app/(home)/admin/logs/project/page.tsx` - Using InlineSpinner
- [x] `src/app/(home)/admin/logs/notice/page.tsx` - Using InlineSpinner, EmptyState
- [x] `src/app/(home)/admin/logs/requisition/page.tsx` - Using InlineSpinner, EmptyState
- [x] `src/app/(home)/admin/logs/leave/page.tsx` - Using InlineSpinner
- [x] `src/app/(home)/admin/logs/attendance/page.tsx` - Using InlineSpinner
- [x] `src/components/ops/requisition/RequisitionCard.tsx` - Using InlineSpinner
- [x] `src/components/ops/requisition/RequisitionCreateModal.tsx` - Using InlineSpinner (+ fixed lucide→phosphor)
- [x] `src/components/ops/requisition/RequisitionEditModal.tsx` - Using InlineSpinner (+ fixed lucide→phosphor)
- [x] `src/components/ops/requisition/RequisitionCreatePage.tsx` - Using InlineSpinner
- [x] `src/components/ops/leave/LeaveCreatePage.tsx` - Using InlineSpinner
- [x] `src/components/ops/payroll/PayrollHistory.tsx` - Using InlineSpinner
- [x] `src/components/ops/payroll/PayrollGenerationModal.tsx` - Using InlineSpinner
- [x] `src/components/admin/CompanyBasicsConfigView.tsx` - Using LoadingSpinner
- [x] `src/components/admin/tabs/BasicTab.tsx` - Using LoadingSpinner
- [x] `src/components/admin/tabs/AccountsTab.tsx` - Using LoadingSpinner
- [x] `src/components/ops/complaint/ComplaintCreatePage.tsx` - Using InlineSpinner

## 🟡 Remaining Work

### High Priority - Page Headers (Use PageHeader component)
Files with manual page headers that should use PageHeader:
- [x] `src/app/(home)/profile/page.tsx` - ✅ DONE
- [x] `src/app/(home)/ops/hris/page.tsx` - ✅ DONE
- [ ] `src/app/(home)/ops/onboarding/page.tsx` - Manual header with UserPlus icon
- [ ] `src/app/(home)/ops/offboarding/page.tsx` - Manual header with UserMinus icon
- [ ] `src/app/(home)/account/page.tsx` - Manual header "My Account"
- [ ] `src/app/(home)/admin/config/teams/page.tsx` - Manual header with Users icon
- [ ] `src/app/(home)/admin/config/stakeholder-process/page.tsx` - Manual header
- [ ] `src/app/(home)/admin/config/stakeholder-process/[id]/page.tsx` - Manual header
- [ ] `src/app/(home)/admin/data-export/page.tsx` - Manual header "Data Export Center"
- [ ] `src/app/(home)/admin/logs/complaint/page.tsx` - Manual header "Complaint Logs"
- [ ] `src/app/(home)/admin/logs/notice/page.tsx` - Manual header "Notice Logs"
- [ ] `src/app/(home)/admin/logs/requisition/page.tsx` - Manual header "Requisition Logs"
- [ ] `src/app/(home)/ops/tasks/TaskLayout.tsx` - Manual header with ClipboardList icon
- [ ] `src/app/(home)/ops/project/ProjectLayout.tsx` - Manual header with FolderKanban icon
- [ ] `src/components/ops/leave/LeaveHistory.tsx` - Manual header "Leave History"

### High Priority - Search Inputs (Use SearchBar component)
Files using FormInputField or manual input for search:
- [x] `src/app/(home)/ops/hris/page.tsx` - ✅ DONE - Using SearchBar

### High Priority - Loading Spinners (Use LoadingSpinner/InlineSpinner)
**✅ ALL SPINNER PATTERNS COMPLETE!**

Remaining `animate-spin` in codebase are intentional:
- UI Components (LoadingSpinner, InlineSpinner, button) - source of truth
- RefreshCw icon on onboarding/offboarding - intentional refresh icon rotation
- Navigation icon on AttendanceSection - intentional GPS loading rotation

Files refactored:
- [x] `src/app/(home)/profile/page.tsx` - ✅ DONE
- [x] `src/app/(home)/ops/hris/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/tasks/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/project/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/notice/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/requisition/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/leave/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/attendance/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/data-export/page.tsx` - ✅ DONE
- [x] `src/components/admin/CompanyBasicsConfigView.tsx` - ✅ DONE
- [x] `src/components/admin/tabs/BasicTab.tsx` - ✅ DONE
- [x] `src/components/admin/tabs/AccountsTab.tsx` - ✅ DONE
- [x] `src/components/ops/requisition/RequisitionEditModal.tsx` - ✅ DONE
- [x] `src/components/ops/requisition/RequisitionCard.tsx` - ✅ DONE
- [x] `src/components/ops/requisition/RequisitionCreateModal.tsx` - ✅ DONE
- [x] `src/components/ops/requisition/RequisitionCreatePage.tsx` - ✅ DONE
- [x] `src/components/ops/payroll/PayrollGenerationModal.tsx` - ✅ DONE
- [x] `src/components/ops/payroll/PayrollHistory.tsx` - ✅ DONE
- [x] `src/components/ops/leave/LeaveCreatePage.tsx` - ✅ DONE
- [x] `src/components/ops/complaint/ComplaintCreatePage.tsx` - ✅ DONE
- [x] `src/components/admin/teams/TeamPermissionsModal.tsx` - ✅ DONE
- [x] `src/components/admin/teams/TeamMembersModal.tsx` - ✅ DONE (spinner + empty state)
- [x] `src/components/admin/salary/SalaryManagement.tsx` - ✅ DONE
- [x] `src/components/stakeholder-issues/StakeholderIssueForm.tsx` - ✅ DONE
- [x] `src/components/stakeholder-processes/ProcessForm.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/config/stakeholder-process/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/stakeholders/[id]/edit/page.tsx` - ✅ DONE
- [x] `src/app/(home)/home/widgets/StakeholderIssueModal.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/config/teams/page.tsx` - ✅ DONE
- [x] `src/app/(home)/onboarding/onboarding.tsx` - ✅ DONE (2 instances)
- [x] `src/app/(superadmin)/sa/teams/page.tsx` - ✅ DONE (4 instances)
- [x] `src/app/(superadmin)/sa/teams/[companyId]/[teamId]/page.tsx` - ✅ DONE (4 instances)
- [x] `src/app/(superadmin)/sa/users/page.tsx` - ✅ DONE
- [x] `src/components/ui/GeolocationPicker.tsx` - ✅ DONE
- [x] `src/components/ui/ReportProblemModal.tsx` - ✅ DONE
- [x] `src/components/admin/attendance/ClientMap.tsx` - ✅ DONE
- [x] `src/app/contact/page.tsx` - ✅ DONE

### High Priority - Empty States (Use EmptyState component)
Files with manual empty state displays:
- [x] `src/app/(home)/ops/hris/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/notice/page.tsx` - ✅ DONE
- [x] `src/app/(home)/admin/logs/requisition/page.tsx` - ✅ DONE
- [x] `src/components/admin/teams/TeamMembersModal.tsx` - ✅ DONE
- [ ] `src/app/(home)/ops/notice/page.tsx` - Manual empty state
- [ ] `src/app/(home)/admin/stakeholders/page.tsx` - Manual empty state
- [ ] `src/app/(home)/admin/config/teams/page.tsx` - Manual empty states (2 instances)
- [ ] `src/app/(home)/ops/stakeholder-issues/page.tsx` - Manual empty state
- [ ] `src/app/(home)/profile/tabs/EducationExperienceTab.tsx` - Manual empty states
- [ ] `src/app/(home)/hris/tabs/EducationExperienceTab.tsx` - Manual empty states
- [ ] `src/components/admin/salary/SalaryManagement.tsx` - Manual empty states (2 instances)
- [ ] `src/components/admin/stakeholder-types/StakeholderTypeManagementView.tsx` - Manual empty state
- [ ] `src/components/admin/notice/NoticeManagementView.tsx` - Manual empty state
- [ ] `src/components/admin/complaints/ComplaintsManagementView.tsx` - Manual empty state
- [ ] `src/components/admin/supervisor-lineage/SupervisorLineageView.tsx` - Manual empty state
- [ ] `src/components/ops/attendance/PresentPage.tsx` - Plain text empty state
- [ ] `src/components/ops/attendance/AbsentPage.tsx` - Plain text empty state
- [ ] `src/components/ops/attendance/LatePage.tsx` - Plain text empty state
- [ ] `src/components/ops/attendance/RecordsPage.tsx` - Plain text empty state
- [ ] `src/components/stakeholder-processes/StepManager.tsx` - Manual empty states
- [ ] `src/components/stakeholder-issues/StakeholderIssuesTab.tsx` - Manual empty state
- [ ] `src/components/notifications/NotificationDropdown.tsx` - Manual empty state

### Medium Priority - window.confirm Replacements (Use ConfirmationModal)
- [ ] `src/app/(home)/ops/notice/page.tsx` - Delete notice confirmation
- [ ] `src/app/(home)/admin/stakeholders/[id]/page.tsx` - Stakeholder action confirmations
- [ ] `src/app/(home)/profile/tabs/EducationExperienceTab.tsx` - Delete education/experience records
- [ ] `src/app/(home)/hris/tabs/EducationExperienceTab.tsx` - Delete education/experience records
- [ ] `src/app/(home)/admin/config/stakeholder-process/page.tsx` - Delete process confirmation
- [ ] `src/app/(home)/account/page.tsx` - Logout confirmation
- [ ] `src/components/admin/tabs/AccountsTab.tsx` - Delete account confirmation
- [ ] `src/components/stakeholder-processes/StepManager.tsx` - Delete step confirmation

### Medium Priority - Badge Standardization (Use Badge/StatusBadge)
Files with manual badge implementations:
- [ ] `src/app/(home)/admin/logs/tasks/page.tsx` - Status badges
- [ ] `src/app/(home)/admin/logs/project/page.tsx` - Status badges
- [ ] `src/app/(home)/admin/stakeholders/page.tsx` - Status badges
- [ ] `src/app/(home)/admin/stakeholders/[id]/page.tsx` - Status badges
- [ ] `src/app/(home)/account/page.tsx` - Role/status badges
- [ ] `src/app/(home)/ops/onboarding/page.tsx` - "New Request" badge
- [ ] `src/components/admin/tabs/AccountsTab.tsx` - Manual badges
- [ ] `src/components/ops/requisition/RequisitionCard.tsx` - Status badge

### Low Priority - Modal Refactoring (Complex)
- [ ] `src/app/(superadmin)/sa/users/page.tsx` - Complex multi-step superadmin grant modal
- [ ] `src/app/(superadmin)/sa/teams/[companyId]/[teamId]/page.tsx` - Add member modal with employee search

### Completed Modal Refactoring
- [x] `src/app/(superadmin)/sa/countries/page.tsx` - Using SuperadminFormModal
- [x] `src/app/(superadmin)/sa/industries/page.tsx` - Using SuperadminFormModal
- [x] `src/app/(superadmin)/sa/companies/page.tsx` - Using SuperadminFormModal (size="lg")
- [x] `src/app/(superadmin)/sa/teams/page.tsx` - Using SuperadminFormModal + ConfirmationModal
- [x] `src/app/(superadmin)/sa/teams/[companyId]/[teamId]/page.tsx` - Remove member uses ConfirmationModal

---

## Component Specifications

### SearchBar
```tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  withContainer?: boolean; // Wraps in card-like container
}
```

### StatCard
```tsx
interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'cyan';
  trend?: { value: number; isPositive: boolean };
  className?: string;
}
```

### PageHeader
```tsx
interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'gradient';
    color?: string;
  };
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}
```

### AdminSection / Section
```tsx
interface SectionProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
  emptyState?: {
    show: boolean;
    message: string;
  };
  className?: string;
}
```

### EntityListItem
```tsx
interface EntityListItemProps {
  icon?: ReactNode;
  name: string;
  subtitle?: string;
  actions?: {
    onView?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    custom?: ReactNode;
  };
  loading?: boolean;
  className?: string;
}
```

### DataTable
```tsx
interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}
```

### Badge (Enhanced)
```tsx
interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}
```

### SuperadminFormModal
```tsx
interface SuperadminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  subtitle?: string;
  icon: ComponentType<IconProps> | ReactNode;
  colorScheme: 'emerald' | 'violet' | 'blue' | 'amber' | 'red' | 'indigo';
  saving?: boolean;
  submitDisabled?: boolean;
  submitText?: string;
  isEditing?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}

// Usage example:
<SuperadminFormModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={handleSubmit}
  title="Add Country"
  subtitle="Create a new country entry"
  icon={GlobeHemisphereWest}
  colorScheme="emerald"
  saving={saving}
  submitDisabled={!formData.name.trim()}
  isEditing={false}
>
  <div>
    <label className="block text-sm font-medium text-foreground-secondary mb-1.5">
      Country Name <span className="text-red-500">*</span>
    </label>
    <input type="text" value={formData.name} onChange={...} />
  </div>
</SuperadminFormModal>
```

### ConfirmationModal
```tsx
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: ReactNode;  // Supports JSX for custom content
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

// Usage example:
<ConfirmationModal
  isOpen={!!teamToDelete}
  onClose={() => setTeamToDelete(null)}
  onConfirm={handleDelete}
  title="Delete Team"
  message={
    <>
      <p>Are you sure you want to delete <strong>{teamToDelete?.name}</strong>?</p>
      <div className="bg-red-50 p-3 rounded-lg mt-3">
        <p className="font-medium">This cannot be undone.</p>
      </div>
    </>
  }
  confirmText="Delete"
  variant="danger"
  isLoading={isDeleting}
/>
```

### InlineDeleteConfirm
```tsx
interface InlineDeleteConfirmProps {
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onInitiate: () => void;
  disabled?: boolean;
  disabledTitle?: string;
  size?: 'sm' | 'md';
}

// Usage example:
<InlineDeleteConfirm
  isConfirming={deleteConfirm === item.id}
  onConfirm={() => handleDelete(item.id)}
  onCancel={() => setDeleteConfirm(null)}
  onInitiate={() => setDeleteConfirm(item.id)}
  disabled={stats[item.id] > 0}
  disabledTitle="Cannot delete: has associated records"
  size="sm"
/>
```

### InlineSpinner
```tsx
type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'white' | 'primary' | 'blue' | 'emerald' | 'violet' | 'amber' | 'red' | 'gray' | 'current';

interface SpinnerProps {
  size?: SpinnerSize;   // xs=12px, sm=16px, md=24px, lg=32px, xl=40px
  color?: SpinnerColor;
  className?: string;
}

// Usage in buttons:
<button disabled={saving}>
  {saving && <InlineSpinner size="sm" color="white" className="mr-2" />}
  Save
</button>

// Usage in loading sections:
<div className="flex flex-col items-center justify-center p-12">
  <InlineSpinner size="xl" color="blue" className="mb-4" />
  <p>Loading...</p>
</div>
```

---

## Progress Log

### [Date: In Progress]
- Initial analysis completed
- Identified 8+ major duplicated patterns
- Created component specifications
- Starting implementation phase

---

## Notes
- All new components should follow theme guidelines (use CSS variables, no hardcoded colors)
- Use Phosphor Icons only
- Follow existing animation patterns (Framer Motion)
- Ensure dark mode support
- Support responsive design patterns
