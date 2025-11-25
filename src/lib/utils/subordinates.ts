/**
 * Subordinate relationship utilities
 * Functions for checking and fetching supervisor-subordinate relationships
 */

import { supabase } from "@/lib/supabase/client";
import { Employee } from "@/lib/types/schemas";

// Employee interface for subordinate operations - extends base with supervisor relationship
interface EmployeeWithSupervisor {
  id: string;
  supervisor_id?: string | null;
  company_id: number;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

/**
 * Check if targetEmployeeId is a subordinate (direct or indirect) of supervisorId
 * @param targetEmployeeId - The employee to check
 * @param supervisorId - The potential supervisor
 * @param companyId - Company ID for scoping (optional, will fetch if not provided)
 * @returns Promise<boolean> - True if targetEmployee reports to supervisor
 */
export async function isSubordinate(
  targetEmployeeId: string,
  supervisorId: string,
  companyId?: number
): Promise<boolean> {
  try {
    if (!targetEmployeeId || !supervisorId || targetEmployeeId === supervisorId) {
      return false;
    }

    // Fetch the target employee's supervisor chain
    let currentEmployeeId = targetEmployeeId;
    let maxDepth = 10; // Prevent infinite loops
    let depth = 0;

    while (currentEmployeeId && depth < maxDepth) {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('supervisor_id, company_id')
        .eq('id', currentEmployeeId)
        .single();

      if (error || !employee) {
        return false;
      }

      // Check company match if provided
      if (companyId && employee.company_id !== companyId) {
        return false;
      }

      // Found the supervisor in the chain
      if (employee.supervisor_id === supervisorId) {
        return true;
      }

      // No supervisor, reached the top
      if (!employee.supervisor_id) {
        return false;
      }

      // Move up the chain
      currentEmployeeId = employee.supervisor_id;
      depth++;
    }

    return false;
  } catch (error) {
    console.error('Error checking subordinate relationship:', error);
    return false;
  }
}

/**
 * Fetch all subordinates (direct and indirect) for a supervisor
 * @param supervisorId - The supervisor's employee ID
 * @param companyId - Company ID for scoping
 * @param includeIndirect - Whether to include indirect reports (default: true)
 * @returns Promise<Employee[]> - Array of subordinate employees
 */
export async function fetchSubordinates(
  supervisorId: string,
  companyId: number,
  includeIndirect: boolean = true
): Promise<Employee[]> {
  try {
    if (!supervisorId || !companyId) {
      return [];
    }

    const subordinates: EmployeeWithSupervisor[] = [];
    const processedIds = new Set<string>();
    const toProcess: string[] = [supervisorId];

    let maxIterations = 100; // Safety limit
    let iterations = 0;

    while (toProcess.length > 0 && iterations < maxIterations) {
      const currentId = toProcess.shift()!;

      // Skip if already processed
      if (processedIds.has(currentId)) {
        continue;
      }
      processedIds.add(currentId);

      // Fetch direct reports
      const { data: directReports, error } = await supabase
        .from('employees')
        .select('*')
        .eq('supervisor_id', currentId)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching direct reports:', error);
        continue;
      }

      if (directReports && directReports.length > 0) {
        // Add direct reports to result (exclude the original supervisor)
        const reports = directReports.filter(emp => emp.id !== supervisorId);
        subordinates.push(...reports);

        // If including indirect reports, add their IDs to process queue
        if (includeIndirect) {
          toProcess.push(...reports.map(emp => emp.id));
        }
      }

      iterations++;
    }

    // Map to Employee interface
    return subordinates.map(emp => ({
      id: emp.id,
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      email: emp.email || '',
      department: emp.department,
      designation: emp.designation,
    }));
  } catch (error) {
    console.error('Error fetching subordinates:', error);
    return [];
  }
}

/**
 * Fetch subordinate IDs only (more efficient for permission checks)
 * @param supervisorId - The supervisor's employee ID
 * @param companyId - Company ID for scoping
 * @param includeIndirect - Whether to include indirect reports (default: true)
 * @returns Promise<string[]> - Array of subordinate employee IDs
 */
export async function fetchSubordinateIds(
  supervisorId: string,
  companyId: number,
  includeIndirect: boolean = true
): Promise<string[]> {
  try {
    if (!supervisorId || !companyId) {
      return [];
    }

    const subordinateIds = new Set<string>();
    const toProcess: string[] = [supervisorId];
    const processedIds = new Set<string>();

    let maxIterations = 100;
    let iterations = 0;

    while (toProcess.length > 0 && iterations < maxIterations) {
      const currentId = toProcess.shift()!;

      if (processedIds.has(currentId)) {
        continue;
      }
      processedIds.add(currentId);

      // Fetch direct reports (only IDs for efficiency)
      const { data: directReports, error } = await supabase
        .from('employees')
        .select('id')
        .eq('supervisor_id', currentId)
        .eq('company_id', companyId);

      if (error) {
        console.error('Error fetching subordinate IDs:', error);
        continue;
      }

      if (directReports && directReports.length > 0) {
        directReports.forEach(emp => {
          if (emp.id !== supervisorId) {
            subordinateIds.add(emp.id);
            if (includeIndirect) {
              toProcess.push(emp.id);
            }
          }
        });
      }

      iterations++;
    }

    return Array.from(subordinateIds);
  } catch (error) {
    console.error('Error fetching subordinate IDs:', error);
    return [];
  }
}

/**
 * Get direct reports only (first level subordinates)
 * @param supervisorId - The supervisor's employee ID
 * @param companyId - Company ID for scoping
 * @returns Promise<Employee[]> - Array of direct report employees
 */
export async function fetchDirectReports(
  supervisorId: string,
  companyId: number
): Promise<Employee[]> {
  return fetchSubordinates(supervisorId, companyId, false);
}

/**
 * Check if user is a supervisor (has any direct reports)
 * @param employeeId - The employee ID to check
 * @param companyId - Company ID for scoping
 * @returns Promise<boolean> - True if employee has direct reports
 */
export async function isSupervisor(
  employeeId: string,
  companyId: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('id')
      .eq('supervisor_id', employeeId)
      .eq('company_id', companyId)
      .limit(1);

    if (error) {
      console.error('Error checking supervisor status:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking supervisor status:', error);
    return false;
  }
}

/**
 * Get supervisor chain for an employee (bottom to top)
 * @param employeeId - The employee ID
 * @param companyId - Company ID for scoping
 * @returns Promise<Employee[]> - Array of supervisors from immediate to top
 */
export async function getSupervisorChain(
  employeeId: string,
  companyId: number
): Promise<Employee[]> {
  try {
    const chain: EmployeeWithSupervisor[] = [];
    let currentId = employeeId;
    let maxDepth = 10;
    let depth = 0;

    while (currentId && depth < maxDepth) {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', currentId)
        .eq('company_id', companyId)
        .single();

      if (error || !employee || !employee.supervisor_id) {
        break;
      }

      // Fetch the supervisor
      const { data: supervisor, error: supervisorError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employee.supervisor_id)
        .eq('company_id', companyId)
        .single();

      if (supervisorError || !supervisor) {
        break;
      }

      chain.push(supervisor);
      currentId = supervisor.id;
      depth++;
    }

    // Map to Employee interface
    return chain.map(emp => ({
      id: emp.id,
      name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      email: emp.email || '',
      department: emp.department,
      designation: emp.designation,
    }));
  } catch (error) {
    console.error('Error fetching supervisor chain:', error);
    return [];
  }
}
