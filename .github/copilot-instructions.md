# Copilot Instructions for Flow HRIS System

## Project Architecture

This is a **Next.js 15 + Supabase HRIS (Human Resource Information System)** with role-based access control for Employee, Manager, and Admin roles. The app uses server-side rendering with Supabase Auth for authentication and PostgreSQL for data persistence.

### Key Architectural Patterns

**App Router Structure**: Uses Next.js App Router with route groups:
- `(auth)/*` - Authentication pages (login, signup, forgot-password)
- `(home)/*` - Main application with role-based navigation (requires approval)
- Route-level middleware handles authentication and role-based access control

**Authentication Flow**: 
- Server actions in `src/app/(auth)/auth-actions.ts` handle login/signup
- `src/middleware.ts` manages session validation and role-based routing
- `AuthProvider` context provides user state and approval status across the app
- Users must have `has_approval` set to access main application features

**Supabase Integration**:
- Server components use `createClient()` from `src/lib/supabase/server.ts`
- Client components use `supabase` from `src/lib/supabase/client.ts`
- All database operations go through custom hooks in `src/hooks/`

## Development Patterns

### Component Architecture
- **BaseForm**: All forms extend `src/components/forms/BaseForm.tsx` with Framer Motion animations
- **Custom Hooks**: Data fetching follows the pattern in `src/hooks/useEmployees.tsx` - loading states, error handling, and caching
- **UI Components**: Reusable components in `src/components/ui/` with consistent styling patterns

### State Management
- **Form State**: Use `useFormState` hook from `src/hooks/useFormState.ts` for validation and dirty checking
- **Authentication**: `AuthProvider` context manages user session and role-based permissions
- **Data Fetching**: Custom hooks handle API calls with loading/error states

### Type System
- **Single Source of Truth**: All types exported from `src/lib/types/index.ts` → `schemas.ts`
- **No Zod**: Uses pure TypeScript interfaces instead of runtime validation
- **Constants**: Centralized in `src/lib/constants/index.ts` with STATUS enums and role definitions

### Styling Conventions
- **Tailwind CSS**: Standard setup with custom CSS variables for theming
- **Animations**: Framer Motion with reusable variants in `src/components/ui/animations.ts`
- **Icons**: Phosphor Icons (`@phosphor-icons/react`) used consistently throughout

## Role-Based Access Control

Navigation and features are controlled by user roles defined in `src/app/(home)/nav-items.ts`:
- **Employee**: Basic HRIS features (profile, attendance, leave)
- **Manager**: Employee features + team management and finder
- **Admin**: Full access including admin management panel

Role validation happens at:
1. Middleware level (`src/middleware.ts`)
2. Component level (nav items filtered by role)
3. Hook level (data filtering based on permissions)

## Development Workflow

### Running the Application
```bash
npm run dev          # Development with Turbopack
npm run build        # Production build
npm run lint         # ESLint checking
```

### Key Development Notes
- **Build Configuration**: TypeScript and ESLint errors are ignored in production builds (`next.config.ts`)
- **Environment**: Requires Supabase environment variables for database connection
- **Debugging**: Next.js debug server available via terminal for server-side issues

### Common Patterns When Adding Features
1. **New Data Entity**: Add type to `schemas.ts`, create custom hook in `src/hooks/`, add API functions
2. **New Page**: Follow route group structure, implement role-based access in middleware
3. **New Form**: Extend `BaseForm`, use `useFormState` for validation, follow existing form patterns in `src/components/forms/`
4. **New Admin Feature**: Add to admin management structure with collapsible components

### File Organization
- `src/lib/api/` - Supabase database functions
- `src/lib/auth/` - Authentication utilities and context
- `src/lib/constants/` - Application constants and enums
- `src/lib/validation/` - Form validation schemas and utilities
- `src/components/admin-management/` - Admin-specific components with collapsible patterns

When working with this codebase, always consider the role-based permissions and use the established patterns for data fetching, form handling, and component structure.
