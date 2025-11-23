# Theming Guide - Flow HRIS System

## Overview

The Flow HRIS system uses a comprehensive theming system built on Tailwind CSS with CSS custom properties. The system supports:
- Light and dark modes
- Multiple color schemes (blue, green, purple, orange)
- Automatic system preference detection
- localStorage persistence
- Seamless theme switching

## Getting Started

### 1. Theme Provider Setup

Wrap your application with the `ThemeProvider`:

```tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Using the Theme Hook

Access and control the theme in any component:

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { mode, colorScheme, setMode, setColorScheme, toggleMode } = useTheme();
  
  return (
    <div>
      <button onClick={toggleMode}>
        Switch to {mode === 'light' ? 'dark' : 'light'} mode
      </button>
      <button onClick={() => setColorScheme('green')}>
        Use Green Theme
      </button>
    </div>
  );
}
```

### 3. Theme Switcher Component

Use the built-in `ThemeSwitcher` component:

```tsx
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

function Header() {
  return (
    <header>
      <ThemeSwitcher />
    </header>
  );
}
```

## Color System

### Primary Colors

The primary color adapts based on the selected color scheme:

```tsx
// All shades available from 50 to 950
className="bg-primary-500 text-primary-100"
className="border-primary-600 hover:bg-primary-700"
```

### Background Colors

```tsx
// Primary background (main page background)
className="bg-background-primary"

// Secondary background (cards, panels)
className="bg-background-secondary"

// Tertiary background (subtle highlights)
className="bg-background-tertiary"
```

### Text/Foreground Colors

```tsx
// Primary text (headings, important text)
className="text-foreground-primary"

// Secondary text (body text, labels)
className="text-foreground-secondary"

// Tertiary text (hints, placeholders)
className="text-foreground-tertiary"
```

### Border Colors

```tsx
// Primary borders (main borders)
className="border-border-primary"

// Secondary borders (subtle dividers)
className="border-border-secondary"
```

### Surface Colors

```tsx
// Primary surface (cards, modals)
className="bg-surface-primary"

// Secondary surface (nested cards)
className="bg-surface-secondary"

// Hover state
className="hover:bg-surface-hover"
```

### Semantic Colors

For status indicators and alerts:

```tsx
className="text-success"  // Green for success states
className="text-warning"  // Yellow/orange for warnings
className="text-error"    // Red for errors
className="text-info"     // Blue for informational
```

## Icon Usage

### Unified Icon System

**ALWAYS** import icons from the unified icon system:

```tsx
import { User, Settings, Calendar, CheckCircle } from '@/lib/icons';

function MyComponent() {
  return (
    <>
      <User size={20} weight="duotone" />
      <Settings size={24} weight="bold" />
      <Calendar size={16} weight="regular" />
      <CheckCircle size={20} weight="fill" />
    </>
  );
}
```

### Icon Sizes

- **Small (16px)**: List items, inline text
- **Regular (20px)**: Default buttons, form fields
- **Medium (24px)**: Headers, important actions
- **Large (32px+)**: Empty states, illustrations

### Icon Weights

- **regular**: Default weight for most use cases
- **bold**: Emphasis, headers, important actions
- **duotone**: Decorative, branded elements
- **fill**: Solid icons, selected states
- **thin/light**: Subtle, background elements

## Component Patterns

### Buttons

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="danger">Delete</Button>
```

### Form Fields

```tsx
import FormField from '@/components/forms/FormField';
import { User } from '@/lib/icons';

<FormField
  label="Username"
  name="username"
  icon={<User size={20} />}
  value={value}
  onChange={handleChange}
  error={errors.username}
  required
/>
```

### Cards

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Settings } from '@/lib/icons';

<Card>
  <CardHeader
    title="Settings"
    subtitle="Manage your preferences"
    icon={<Settings size={20} />}
  />
  <CardContent>
    {/* Card content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

### Modals

```tsx
import BaseModal from '@/components/ui/modals/BaseModal';
import { User } from '@/lib/icons';

<BaseModal
  isOpen={isOpen}
  onClose={onClose}
  title="User Details"
  icon={<User size={24} />}
  size="md"
>
  {/* Modal content */}
</BaseModal>
```

## Dark Mode Best Practices

### Automatic Dark Mode Support

All theme colors automatically adapt to dark mode. You don't need to add `dark:` variants manually when using theme colors:

```tsx
// ✅ Good - Automatically adapts
className="bg-surface-primary text-foreground-primary border-border-primary"

// ❌ Bad - Don't hardcode colors
className="bg-white text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-700"
```

### When to Use dark: Prefix

Only use `dark:` for specific overrides not covered by theme colors:

```tsx
// Custom shadows
className="shadow-sm dark:shadow-lg"

// Special cases
className="bg-primary-600 dark:bg-primary-500"
```

## Color Schemes

### Available Schemes

1. **Blue** (default) - Professional, trustworthy
2. **Green** - Growth, success-oriented
3. **Purple** - Creative, modern
4. **Orange** - Energetic, warm

### Changing Color Scheme

```tsx
import { useTheme } from '@/contexts/ThemeContext';

function ThemeSelector() {
  const { setColorScheme } = useTheme();
  
  return (
    <select onChange={(e) => setColorScheme(e.target.value as ColorScheme)}>
      <option value="blue">Blue</option>
      <option value="green">Green</option>
      <option value="purple">Purple</option>
      <option value="orange">Orange</option>
    </select>
  );
}
```

## Migration Guide

### From Hardcoded Colors to Theme Colors

| Old (Hardcoded) | New (Theme) |
|----------------|-------------|
| `bg-white` | `bg-surface-primary` or `bg-background-primary` |
| `bg-gray-100` | `bg-background-secondary` or `bg-surface-secondary` |
| `text-gray-900` | `text-foreground-primary` |
| `text-gray-600` | `text-foreground-secondary` |
| `text-gray-400` | `text-foreground-tertiary` |
| `border-gray-200` | `border-border-primary` |
| `border-gray-300` | `border-border-secondary` |
| `bg-blue-600` | `bg-primary-600` |
| `text-blue-600` | `text-primary-600` |
| `hover:bg-gray-50` | `hover:bg-surface-hover` |

### Example Migration

Before:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4">
  <h2 className="text-gray-900 font-bold mb-2">Title</h2>
  <p className="text-gray-600">Description</p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
    Action
  </button>
</div>
```

After:
```tsx
<div className="bg-surface-primary border border-border-primary rounded-lg p-4">
  <h2 className="text-foreground-primary font-bold mb-2">Title</h2>
  <p className="text-foreground-secondary">Description</p>
  <Button variant="primary">Action</Button>
</div>
```

## Testing

### Testing Both Modes

Always test your components in both light and dark modes:

```tsx
// In your component
const { mode, toggleMode } = useTheme();

// Toggle during development
<button onClick={toggleMode}>Toggle Theme</button>
```

### Testing Different Color Schemes

Test all color schemes to ensure consistency:

```tsx
const { setColorScheme } = useTheme();

<div>
  <button onClick={() => setColorScheme('blue')}>Blue</button>
  <button onClick={() => setColorScheme('green')}>Green</button>
  <button onClick={() => setColorScheme('purple')}>Purple</button>
  <button onClick={() => setColorScheme('orange')}>Orange</button>
</div>
```

## Common Patterns

### Status Indicators

```tsx
import { StatusBadge } from '@/components/ui/Card';

<StatusBadge status="Completed" variant="success" />
<StatusBadge status="Pending" variant="warning" />
<StatusBadge status="Failed" variant="error" />
<StatusBadge status="Info" variant="info" />
```

### Loading States

```tsx
import { Button } from '@/components/ui/button';
import { Loader } from '@/lib/icons';

<Button variant="primary" isLoading={isLoading}>
  {isLoading ? <Loader className="animate-spin" /> : 'Submit'}
</Button>
```

### Empty States

```tsx
import { EmptyState } from '@/components/ui/EmptyState';
import { FileText } from '@/lib/icons';

<EmptyState
  icon={<FileText size={48} weight="duotone" />}
  title="No items found"
  description="Create your first item to get started"
/>
```

## Troubleshooting

### Theme Not Applying

1. Ensure `ThemeProvider` wraps your app
2. Check that you're using theme color variables
3. Verify `globals.css` is imported in your layout

### Colors Not Changing

1. Hard refresh the page (Ctrl/Cmd + Shift + R)
2. Clear localStorage: `localStorage.clear()`
3. Check browser console for errors

### Dark Mode Issues

1. Verify HTML has `dark` class in dark mode
2. Check CSS variable definitions in `globals.css`
3. Ensure you're not overriding with hardcoded colors

## Best Practices

1. **Always use theme colors** - Never hardcode colors
2. **Use semantic naming** - Use `bg-surface-primary` instead of `bg-white`
3. **Test both modes** - Always check light and dark modes
4. **Use the Button component** - Don't create custom button styles
5. **Import icons from unified system** - Use `@/lib/icons`
6. **Follow the pattern** - Look at existing components for examples
7. **Think about contrast** - Ensure text is readable in all themes
8. **Be consistent** - Use the same patterns across the app

## Resources

- Theme Configuration: `src/lib/theme/theme-config.ts`
- Theme Context: `src/contexts/ThemeContext.tsx`
- Global Styles: `src/app/globals.css`
- Tailwind Config: `tailwind.config.ts`
- Unified Icons: `src/lib/icons.ts`
- UI Components: `src/components/ui/`
