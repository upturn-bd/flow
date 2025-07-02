import { AUTH_ROUTES, EXCLUDE_PATHS, EMPLOYEE_ROUTES, ROUTES } from '@/lib/constants';

// Auth routes that don't require authentication
const authRoutes = AUTH_ROUTES;
const excludePaths = EXCLUDE_PATHS;

// Role-based access control paths
const employeeRoutes = EMPLOYEE_ROUTES;
const managerRoutes = [...employeeRoutes, "/finder"]; // Assuming finder is under home
const adminRoutes = [...managerRoutes, ROUTES.ADMIN.MANAGEMENT];

export { authRoutes, excludePaths, employeeRoutes, managerRoutes, adminRoutes };