# Color Migration Script

This script helps migrate hardcoded Tailwind colors to theme variables.

## Common Color Mappings

### Background Colors

| Old Hardcoded | New Theme Variable | Use Case |
|--------------|-------------------|----------|
| `bg-white` | `bg-surface-primary` | Cards, modals, main surfaces |
| `bg-gray-50` | `bg-background-secondary` | Light backgrounds |
| `bg-gray-100` | `bg-background-tertiary` or `bg-surface-secondary` | Subtle backgrounds, hover states |
| `bg-gray-200` | `bg-surface-secondary` | Dividers, subtle containers |
| `bg-gray-800` | `bg-surface-primary` (dark mode handled) | Dark surfaces |
| `bg-gray-900` | `bg-background-primary` (dark mode handled) | Main dark backgrounds |
| `bg-blue-50` | `bg-primary-50` | Light primary background |
| `bg-blue-100` | `bg-primary-100` | Primary light backgrounds |
| `bg-blue-600` | `bg-primary-600` | Primary buttons, accents |
| `bg-blue-700` | `bg-primary-700` | Primary button hover |
| `bg-red-50` | `bg-red-50 dark:bg-red-950/20` | Error backgrounds |
| `bg-red-100` | `bg-red-100 dark:bg-red-900/30` | Error highlights |
| `bg-green-50` | `bg-green-50 dark:bg-green-950/20` | Success backgrounds |
| `bg-green-100` | `bg-green-100 dark:bg-green-900/30` | Success highlights |

### Text Colors

| Old Hardcoded | New Theme Variable | Use Case |
|--------------|-------------------|----------|
| `text-gray-900` | `text-foreground-primary` | Primary text, headings |
| `text-gray-800` | `text-foreground-primary` | Main text |
| `text-gray-700` | `text-foreground-secondary` | Secondary text, labels |
| `text-gray-600` | `text-foreground-secondary` | Body text, descriptions |
| `text-gray-500` | `text-foreground-tertiary` | Muted text, placeholders |
| `text-gray-400` | `text-foreground-tertiary` | Very muted text, disabled |
| `text-blue-600` | `text-primary-600` | Primary links, accents |
| `text-blue-700` | `text-primary-700` | Primary hover states |
| `text-blue-800` | `text-primary-800` | Emphasized primary |
| `text-red-500` | `text-error` or `text-red-500` | Errors (semantic) |
| `text-red-600` | `text-red-600 dark:text-red-400` | Error messages |
| `text-green-600` | `text-success` or `text-green-600` | Success (semantic) |

### Border Colors

| Old Hardcoded | New Theme Variable | Use Case |
|--------------|-------------------|----------|
| `border-gray-200` | `border-border-primary` | Main borders |
| `border-gray-300` | `border-border-secondary` | Emphasized borders |
| `border-blue-600` | `border-primary-600` | Primary borders |
| `border-red-300` | `border-red-300 dark:border-red-700` | Error borders |
| `border-green-300` | `border-green-300 dark:border-green-700` | Success borders |

## Automated Migration

### Find and Replace Patterns

Use these patterns in your editor (VS Code, etc.):

#### Background Colors
```
Find: bg-white(\s|")
Replace: bg-surface-primary$1

Find: bg-gray-50(\s|")
Replace: bg-background-secondary$1

Find: bg-gray-100(\s|")
Replace: bg-surface-secondary$1

Find: bg-gray-200(\s|")
Replace: bg-border-primary$1 (for separators) or bg-surface-hover$1

Find: bg-blue-600(\s|")
Replace: bg-primary-600$1

Find: bg-blue-700(\s|")
Replace: bg-primary-700$1
```

#### Text Colors
```
Find: text-gray-900(\s|")
Replace: text-foreground-primary$1

Find: text-gray-800(\s|")
Replace: text-foreground-primary$1

Find: text-gray-700(\s|")
Replace: text-foreground-secondary$1

Find: text-gray-600(\s|")
Replace: text-foreground-secondary$1

Find: text-gray-500(\s|")
Replace: text-foreground-tertiary$1

Find: text-gray-400(\s|")
Replace: text-foreground-tertiary$1

Find: text-blue-600(\s|")
Replace: text-primary-600$1
```

#### Border Colors
```
Find: border-gray-200(\s|")
Replace: border-border-primary$1

Find: border-gray-300(\s|")
Replace: border-border-secondary$1

Find: border-blue-600(\s|")
Replace: border-primary-600$1
```

## Manual Review Required

Some colors need context to migrate properly:

### Status Colors
- `bg-red-*` / `text-red-*`: Keep for errors, or use semantic `bg-red-100 dark:bg-red-900/30`
- `bg-green-*` / `text-green-*`: Keep for success, or use semantic `bg-green-100 dark:bg-green-900/30`
- `bg-yellow-*` / `text-yellow-*`: Keep for warnings
- `bg-purple-*` / `text-purple-*`: Specific use cases, review individually

### Gradients
- `bg-gradient-*`: Review and potentially convert to primary color gradients

### Opacity
- `bg-opacity-*`: May need adjustment with new color system

## Migration Workflow

1. **Backup**: Create a branch before starting
2. **Start with UI components**: `src/components/ui/`
3. **Move to forms**: `src/components/forms/`
4. **Then pages**: `src/app/`
5. **Test**: Build and visually verify in both light and dark modes
6. **Iterate**: Fix any issues, adjust mappings as needed

## Testing

After migration:
```bash
npm run build
```

Check for:
- Build errors
- Visual regressions in light mode
- Visual regressions in dark mode
- Proper contrast ratios
- Hover/focus states

## Example Migration

### Before:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4">
  <h2 className="text-gray-900 font-bold mb-2">Title</h2>
  <p className="text-gray-600">Description</p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
    Action
  </button>
</div>
```

### After:
```tsx
<div className="bg-surface-primary border border-border-primary rounded-lg p-4">
  <h2 className="text-foreground-primary font-bold mb-2">Title</h2>
  <p className="text-foreground-secondary">Description</p>
  <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">
    Action
  </button>
</div>
```

## Priority Files

Start with these high-impact files (most color usage):

1. `src/app/(home)/admin/data-export/page.tsx` (117 instances)
2. `src/app/(home)/admin/stakeholders/[id]/page.tsx` (87 instances)
3. `src/components/stakeholder-processes/StepManager.tsx` (77 instances)
4. `src/components/admin/tabs/AccountsTab.tsx` (69 instances)
5. `src/components/stakeholders/StakeholderTransactions.tsx` (68 instances)

## Notes

- Test each file after migration
- Some colors are contextual and may not have direct mapping
- Preserve semantic meaning (error = red, success = green)
- When in doubt, test in both themes before committing
