````instructions
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
- `src/middleware.ts` manages session validation and role-based routing with path arrays from `src/lib/utils/path-utils.ts`
- `AuthProvider` context provides user state and approval status across the app
- Users must have `has_approval` set to access main application features

**Supabase Integration**:
- Server components use `createClient()` from `src/lib/supabase/server.ts`
- Client components use `supabase` from `src/lib/supabase/client.ts`
- All database operations go through custom hooks in `src/hooks/`

## Development Patterns

### Form Architecture & Validation
- **BaseForm**: All forms extend `src/components/forms/BaseForm.tsx` with Framer Motion animations
- **Form State Management**: 
  - Primary: `useFormState` hook from `src/hooks/useFormState.ts` for validation and dirty tracking
  - Alternative: `useFormValidation` from `src/hooks/core/useFormValidation.tsx` for complex forms
  - Both support real-time validation, dirty checking, and error management
- **Validation Pattern**: Pure TypeScript validation functions (no Zod) with `validationErrorsToObject` helper
- **Modal Forms**: Use `FormModal` component from `src/components/ui/modals/FormModal.tsx` for consistent modal form patterns

### Data Fetching & State Management
- **Custom Hooks**: Follow pattern in `src/hooks/useEmployees.tsx` - loading states, error handling, memoization
- **Hook Organization**: 
  - Domain hooks in `src/hooks/` (useEmployees, useDepartments, etc.)
  - Core reusable hooks in `src/hooks/core/` (useModalState, useFormValidation)
- **Authentication**: `AuthProvider` context manages user session and role-based permissions
- **Company Context**: Most data operations require company_id from `getCompanyId()` utility

### User/Employee Search Pattern (CRITICAL)
- **ALWAYS** use unified search utilities from `src/lib/utils/user-search.ts` for user/employee selection
- **Searchable Fields** (in priority order):
  1. `name` - Employee's full name (required)
  2. `email` - Employee's email address (optional)
  3. `designation` - Employee's job title/position (optional)
- **Standard Functions**:
  - `matchesEmployeeSearch(employee, searchTerm)` - Returns boolean if employee matches search
  - `filterEmployeesBySearch(employees, searchTerm)` - Filters array of employees by search term
- **Implementation**: All user selection components (AssigneeField, SingleEmployeeSelector, AssigneeSelect, etc.) use these utilities
- **Rule**: Users must ALWAYS be searchable by name, email, and designation across the entire application

### Type System & Constants
- **Single Source of Truth**: All types exported from `src/lib/types/index.ts` → `schemas.ts`
- **No Runtime Validation**: Uses pure TypeScript interfaces instead of Zod schemas
- **Constants Structure**: Centralized in `src/lib/constants/index.ts`:
  - STATUS enums for all entity states
  - ROUTES object with nested auth/employee/admin paths
  - Role definitions and path arrays for middleware

### UI & Styling Conventions
- **Tailwind CSS**: Standard setup with custom CSS variables for theming
- **Animations**: Framer Motion with reusable variants in `src/components/ui/animations.ts` (fadeInUp, staggerContainer, etc.)
- **Icons**: Mixed usage - Phosphor Icons (`@phosphor-icons/react`) primary, Lucide React for specific cases
- **Rich Text**: TipTap editor integration for content editing features

## Role-Based Access Control

Navigation and features are controlled by user roles defined in `src/app/(home)/nav-items.ts`:
- **Employee**: Basic HRIS features (home, hris, operations-and-services)
- **Manager**: Employee features + finder access
- **Admin**: Full access including admin panel

Role validation happens at:
1. **Middleware level**: `src/middleware.ts` with route arrays from `src/lib/utils/path-utils.ts`
2. **Component level**: Nav items filtered by roles array in nav-items.ts
3. **Hook level**: Data filtering based on permissions and company_id

## Development Workflow

### Running the Application
```bash
npm run dev          # Development with Turbopack
npm run build        # Production build (ignores TS/ESLint errors)
npm run lint         # ESLint checking
```

### Critical Development Notes
- **Build Configuration**: `next.config.ts` ignores TypeScript and ESLint errors in builds
- **Environment**: Requires Supabase environment variables for database connection
- **Authentication Flow**: Always check `has_approval` status for main app access
- **Company Context**: Most database queries require company_id filtering

### Common Patterns When Adding Features

1. **New Data Entity**: 
   - Add interface to `src/lib/types/schemas.ts`
   - Create custom hook in `src/hooks/` following useEmployees pattern
   - Add validation function to `src/lib/validation/`
   - Include company_id in all queries

2. **New Form Component**:
   - Extend `BaseForm` for layout and animations
   - Use `useFormState` for validation and state management
   - Follow validation pattern: pure TS function + `validationErrorsToObject`
   - Add `ValidationFeedback` component for user feedback

3. **New Admin Feature**:
   - Add route to `ROUTES.ADMIN` in constants
   - Update role arrays in `path-utils.ts`
   - Use `CollapsibleComponent` pattern in admin
   - Follow modal patterns with `useModalState` hook

4. **New Page Route**:
   - Follow route group structure in app directory
   - Add to appropriate role array in constants
   - Implement middleware protection via path arrays

### File Organization Patterns
- `src/lib/validation/schemas/` - Validation functions organized by domain
- `src/hooks/core/` - Reusable hook abstractions (useModalState, useFormValidation)
- `src/components/admin/` - Admin-specific components with collapsible patterns
- `src/components/ui/modals/` - Reusable modal components (BaseModal, FormModal)

When working with this codebase, always consider company-scoped data, role-based permissions, and use the established form validation patterns. The architecture strongly favors composition and reusable patterns over large monolithic components.

````
