// Auth routes that don't require authentication
const authRoutes = ["/signup", "/login", "/auth", "/forgot-password"];
const excludePaths = ["/signup", "/login", "/auth", "/forgot-password", "/unauthorized", "/api"];

// Role-based access control paths
const employeeRoutes = ["/home", "/hris", "/operations-and-services", "/notifications", "/account", "/profile"];
const managerRoutes = [...employeeRoutes, "/finder"];
const adminRoutes = [...managerRoutes, "/admin-management"];

export { authRoutes, excludePaths, employeeRoutes, managerRoutes, adminRoutes };