# UI Componentization Progress Tracker

## Overview
This document tracks the progress of componentizing duplicated UI patterns across the Flow HRIS codebase.

## Summary

**Components Created:** 12 new reusable components (including SuperadminFormModal, InlineDeleteConfirm, InlineSpinner)
**Files Refactored:** 30+ files across admin, superadmin, and home pages
**Status:** Primary refactoring, modal refactoring, and inline patterns mostly complete ✅
**Remaining:** Complex modals (2 files) - users page and team detail member search

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

## 🟡 Remaining Work

### Modal Refactoring (Priority 4 - 2 files with complex modals)
- [ ] `src/app/(superadmin)/sa/users/page.tsx` - Complex multi-step superadmin grant modal (company select, employee search)
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
