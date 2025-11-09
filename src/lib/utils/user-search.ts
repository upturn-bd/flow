/**
 * Unified user/employee search utilities
 * 
 * This module provides a consistent interface for searching users/employees across the application.
 * All user selection components should use these utilities to ensure searchable fields are unified.
 * 
 * SEARCHABLE FIELDS (in order of priority):
 * 1. name - Employee's full name (required)
 * 2. email - Employee's email address (optional)
 * 3. designation - Employee's job title/position (optional)
 * 
 * These fields ensure users can be found by their identity, contact info, or role.
 */

/**
 * Base employee interface with searchable fields
 */
export interface SearchableEmployee {
  id: string | number;
  name: string;
  email?: string;
  designation?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * Filters employees based on a search term using unified searchable fields
 * 
 * @param employees - Array of employees to filter
 * @param searchTerm - Search query string
 * @returns Filtered array of employees matching the search term
 * 
 * @example
 * const filtered = filterEmployeesBySearch(employees, "john");
 * // Returns employees with "john" in name, email, or designation
 */
export function filterEmployeesBySearch<T extends SearchableEmployee>(
  employees: T[],
  searchTerm: string
): T[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return employees;
  }

  const searchLower = searchTerm.toLowerCase().trim();

  return employees.filter(employee => {
    // Search in name (required field)
    if (employee.name?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in email (optional field)
    if (employee.email?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in designation (optional field)
    if (employee.designation?.toLowerCase().includes(searchLower)) {
      return true;
    }

    return false;
  });
}

/**
 * Checks if an employee matches a search term using unified searchable fields
 * 
 * @param employee - Employee to check
 * @param searchTerm - Search query string
 * @returns Boolean indicating if employee matches search
 * 
 * @example
 * const matches = matchesEmployeeSearch(employee, "john");
 */
export function matchesEmployeeSearch(
  employee: SearchableEmployee,
  searchTerm: string
): boolean {
  if (!searchTerm || searchTerm.trim() === '') {
    return true;
  }

  const searchLower = searchTerm.toLowerCase().trim();

  return !!(
    employee.name?.toLowerCase().includes(searchLower) ||
    employee.email?.toLowerCase().includes(searchLower) ||
    employee.designation?.toLowerCase().includes(searchLower)
  );
}

/**
 * Type guard to check if an object has the required searchable fields
 */
export function isSearchableEmployee(obj: any): obj is SearchableEmployee {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    typeof obj.name === 'string'
  );
}
