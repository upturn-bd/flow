// Path checking utilities for authentication and layout logic

// Role-based route permissions (from middleware.ts)
export const EMPLOYEE_ROUTES = [
  '/home',
  '/profile',
  '/operations-and-services',
  '/notifications',
  '/account',
];

export const MANAGER_ROUTES = [
  '/home',
  '/profile',
  '/operations-and-services',
  '/notifications',
  '/account',
];

export const ADMIN_ROUTES = [
  '/profile',
  '/operations-and-services',
  '/admin-management',
  '/home',
  '/notifications',
  '/account',
];

// All private/protected paths (union of all role routes)
export const PRIVATE_PATHS = Array.from(
  new Set([
    ...EMPLOYEE_ROUTES,
    ...MANAGER_ROUTES,
    ...ADMIN_ROUTES,
  ])
);

// Exclude (public) paths from middleware
export const EXCLUDE_PATHS = [
  '/signin',
  '/signup',
  '/auth',
  '/unauthorized',
  '/api',
];

export const ONBOARDING_ROUTE = '/onboarding';
export const UNAUTHORIZED_ROUTE = '/unauthorized';

export function isPrivatePath(path: string) {
  return PRIVATE_PATHS.some(
    (privatePath) => path === privatePath || path.startsWith(`${privatePath}/`)
  );
}

export function isAdminPath(path: string) {
  return ADMIN_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

export function isEmployeePath(path: string) {
  return EMPLOYEE_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

export function isManagerPath(path: string) {
  return MANAGER_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}

export function isExcludePath(path: string) {
  return EXCLUDE_PATHS.some(
    (excludePath) => path === excludePath || path.startsWith(`${excludePath}/`)
  );
}

export function isOnboardingRoute(path: string) {
  return path === ONBOARDING_ROUTE || path.startsWith(`${ONBOARDING_ROUTE}/`);
}

export function isUnauthorizedRoute(path: string) {
  return path === UNAUTHORIZED_ROUTE || path.startsWith(`${UNAUTHORIZED_ROUTE}/`);
}

export type Role = 'Employee' | 'Manager' | 'Admin';

export function getRoleAllowedPaths(role: Role): string[] {
  switch (role) {
    case 'Employee':
      return EMPLOYEE_ROUTES;
    case 'Manager':
      return MANAGER_ROUTES;
    case 'Admin':
      return ADMIN_ROUTES;
    default:
      return [];
  }
}

export function isAllowedPathForRole(path: string, role: Role): boolean {
  const allowedPaths = getRoleAllowedPaths(role);
  return allowedPaths.some(
    (allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`)
  );
}