/**
 * Central export for all context providers and hooks
 * This simplifies imports throughout the application
 */

// Types
export * from "./types";
export * from "./utils";

// Employees Context
export { EmployeesProvider, useEmployeesContext } from "./EmployeesContext";
export type { ExtendedEmployee } from "./EmployeesContext";

// Departments Context
export { DepartmentsProvider, useDepartmentsContext } from "./DepartmentsContext";

// Divisions Context
export { DivisionsProvider, useDivisionsContext } from "./DivisionsContext";

// Teams Context
export { TeamsProvider, useTeamsContext } from "./TeamsContext";

// Positions Context
export { PositionsProvider, usePositionsContext } from "./PositionsContext";

// Grades Context
export { GradesProvider, useGradesContext } from "./GradesContext";

// Admin Data Context (legacy - will be deprecated)
export { AdminDataProvider, useAdminData } from "./AdminDataContext";

// Combined Data Context Provider
export { DataContextProvider } from "./DataContextProvider";
