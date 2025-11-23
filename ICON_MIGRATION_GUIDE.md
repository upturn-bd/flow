# Icon Migration Guide

## Lucide React → Phosphor Icons Mapping

This document maps Lucide React icons to their Phosphor Icons equivalents used in the Flow HRIS system.

### Common Icons

| Lucide Icon | Phosphor Icon | Import |
|------------|---------------|--------|
| `AlertCircle` | `WarningCircle` | `import { WarningCircle } from '@/lib/icons';` |
| `AlertTriangle` | `Warning` | `import { Warning } from '@/lib/icons';` |
| `ArrowLeft` | `ArrowLeft` | `import { ArrowLeft } from '@/lib/icons';` |
| `ArrowRight` | `ArrowRight` | `import { ArrowRight } from '@/lib/icons';` |
| `Bell` | `Bell` | `import { Bell } from '@/lib/icons';` |
| `Calendar` | `Calendar` | `import { Calendar } from '@/lib/icons';` |
| `Check` | `Check` | `import { Check } from '@/lib/icons';` |
| `CheckCircle` | `CheckCircle` | `import { CheckCircle } from '@/lib/icons';` |
| `CheckCircle2` | `CheckCircle` | `import { CheckCircle } from '@/lib/icons';` |
| `CheckSquare` | `CheckSquare` | `import { CheckSquare } from '@/lib/icons';` |
| `ChevronDown` | `CaretDown` | `import { CaretDown } from '@/lib/icons';` |
| `ChevronUp` | `CaretUp` | `import { CaretUp } from '@/lib/icons';` |
| `Clock` | `Clock` | `import { Clock } from '@/lib/icons';` |
| `DollarSign` | `DollarSign` | `import { DollarSign } from '@/lib/icons';` |
| `Download` | `Download` | `import { Download } from '@/lib/icons';` |
| `Edit` | `Edit` (PencilSimple) | `import { Edit } from '@/lib/icons';` |
| `Edit3` | `Edit` (PencilSimple) | `import { Edit } from '@/lib/icons';` |
| `Eye` | `Eye` | `import { Eye } from '@/lib/icons';` |
| `EyeOff` | `EyeOff` (EyeSlash) | `import { EyeOff } from '@/lib/icons';` |
| `File` | `File` | `import { File } from '@/lib/icons';` |
| `FileText` | `FileText` | `import { FileText } from '@/lib/icons';` |
| `Filter` | `Filter` (FunnelSimple) | `import { Filter } from '@/lib/icons';` |
| `Folder` | `Folder` | `import { Folder } from '@/lib/icons';` |
| `FolderKanban` | `Kanban` | `import { Kanban } from '@/lib/icons';` |
| `GripVertical` | `GripVertical` (DotsNine) | `import { GripVertical } from '@/lib/icons';` |
| `History` | `ClockCounterClockwise` | Need to add to icons.ts |
| `Loader2` | `Loader` (CircleNotch) | `import { Loader } from '@/lib/icons';` |
| `Lock` | `Lock` (LockKey) | `import { Lock } from '@/lib/icons';` |
| `LockKeyhole` | `Lock` (LockKey) | `import { Lock } from '@/lib/icons';` |
| `Mail` | `Mail` (Envelope) | `import { Mail } from '@/lib/icons';` |
| `MapPin` | `MapPin` | `import { MapPin } from '@/lib/icons';` |
| `MessageCircle` | `MessageCircle` (ChatCircle) | `import { MessageCircle } from '@/lib/icons';` |
| `Navigation` | `Navigation` | `import { Navigation } from '@/lib/icons';` |
| `Plus` | `Plus` | `import { Plus } from '@/lib/icons';` |
| `RefreshCw` | `RefreshCw` (ArrowsClockwise) | `import { RefreshCw } from '@/lib/icons';` |
| `RotateCcw` | `RotateCcw` (ArrowCounterClockwise) | `import { RotateCcw } from '@/lib/icons';` |
| `Save` | `Save` (FloppyDisk) | `import { Save } from '@/lib/icons';` |
| `Search` | `Search` (MagnifyingGlass) | `import { Search } from '@/lib/icons';` |
| `Settings` | `Settings` (Gear) | `import { Settings } from '@/lib/icons';` |
| `Trash` | `Trash` (TrashSimple) | `import { Trash } from '@/lib/icons';` |
| `User` | `User` | `import { User } from '@/lib/icons';` |
| `Users` | `Users` | `import { Users } from '@/lib/icons';` |
| `X` | `X` | `import { X } from '@/lib/icons';` |
| `XCircle` | `XCircle` | `import { XCircle } from '@/lib/icons';` |

### Widget-Specific Icons

| Lucide Icon | Phosphor Icon | Import |
|------------|---------------|--------|
| `Briefcase` | `Briefcase` | `import { Briefcase } from '@/lib/icons';` |
| `Building2` | `Building` (Buildings) | `import { Building } from '@/lib/icons';` |

### Missing Icons to Add

Add these to `src/lib/icons.ts`:

```typescript
import {
  ClockCounterClockwise as History,
  Sparkle,
} from '@phosphor-icons/react';

export {
  History,
  Sparkle,
};
```

## Migration Steps

### 1. Update Import Statement

**Before:**
```typescript
import { AlertCircle, Check, User } from 'lucide-react';
```

**After:**
```typescript
import { WarningCircle as AlertCircle, Check, User } from '@/lib/icons';
// OR use the Phosphor name directly
import { WarningCircle, Check, User } from '@/lib/icons';
```

### 2. Update Icon Usage

Most icons have the same API, just update the import:

**Before:**
```tsx
<AlertCircle size={20} />
```

**After:**
```tsx
<WarningCircle size={20} weight="regular" />
```

### 3. Phosphor-Specific Props

Phosphor icons support these additional props:

- `weight`: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"
- `mirrored`: boolean (for RTL support)

**Examples:**
```tsx
<User size={20} weight="duotone" />
<CheckCircle size={24} weight="fill" />
<Settings size={20} weight="bold" />
```

## Files to Update

### High Priority (User-Facing Components)

1. `src/components/ui/NoPermissionMessage.tsx` - Uses `LockKeyhole`
2. `src/components/ui/ServicePageTemplate.tsx` - Uses `LucideIcon` type
3. `src/app/(home)/home/components/` - All widget components

### Medium Priority (Admin Components)

4. `src/components/admin/salary/SalaryManagement.tsx`
5. `src/components/ops/payroll/PayrollGenerationModal.tsx`

### Low Priority (Type Definitions)

6. `src/lib/types/widgets.ts` - Update `LucideIcon` type references

## Testing Checklist

After migration, verify:

- [ ] All icons display correctly
- [ ] Icon sizes are appropriate
- [ ] Icons work in both light and dark modes
- [ ] No console errors about missing imports
- [ ] Icons have proper weight (not too thin or bold)

## Common Issues

### Issue: Icon not rendering

**Solution:** Check that the icon is exported from `src/lib/icons.ts`

### Issue: Wrong icon appearance

**Solution:** Try different `weight` prop values:
```tsx
<Icon size={20} weight="regular" />  // Default
<Icon size={20} weight="duotone" />  // Two-tone
<Icon size={20} weight="fill" />     // Solid
```

### Issue: Icon too large/small

**Solution:** Adjust size prop:
- Small: 16px
- Regular: 20px
- Medium: 24px
- Large: 32px+

## React Icons Migration

For the few instances using react-icons, use this mapping:

| React Icon | Phosphor Icon |
|-----------|---------------|
| Most icons should have direct equivalents in Phosphor |

Check the Phosphor Icons documentation for alternatives: https://phosphoricons.com/
