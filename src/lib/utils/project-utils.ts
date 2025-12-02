import { Project } from "@/lib/types";

/**
 * Generic utility to extract unique employee IDs from an array of entities.
 * Pass the entity array and a list of field names that contain employee IDs.
 * Handles both single ID fields (string) and array fields (string[]).
 */
export function extractEmployeeIds<T extends Record<string, unknown>>(
  entities: T[],
  fields: (keyof T)[]
): string[] {
  const employeeIds = new Set<string>();

  for (const entity of entities) {
    for (const field of fields) {
      const value = entity[field];
      
      if (typeof value === "string" && value) {
        employeeIds.add(value);
      } else if (Array.isArray(value)) {
        for (const id of value) {
          if (typeof id === "string" && id) {
            employeeIds.add(id);
          }
        }
      }
    }
  }

  return Array.from(employeeIds);
}

/**
 * Extract all unique employee IDs from a list of projects.
 * This includes project leads, assignees, and creators.
 * Use this to fetch only the employees needed for display.
 */
export function extractEmployeeIdsFromProjects(projects: Project[]): string[] {
  return extractEmployeeIds(projects as unknown as Record<string, unknown>[], ["project_lead_id", "assignees", "created_by"]);
}

/**
 * Extract employee IDs from tasks (assignees and creator)
 */
export function extractEmployeeIdsFromTasks<T extends { assignees?: string[]; created_by?: string }>(
  tasks: T[]
): string[] {
  return extractEmployeeIds(tasks, ["assignees", "created_by"] as (keyof T)[]);
}

/**
 * Extract employee IDs from requests (employee_id field)
 */
export function extractEmployeeIdsFromRequests<T extends { employee_id?: string }>(
  requests: T[]
): string[] {
  return extractEmployeeIds(requests, ["employee_id"] as (keyof T)[]);
}

/**
 * Extract employee IDs from complaints (created_by, complaint_against)
 */
export function extractEmployeeIdsFromComplaints<T extends { created_by?: string; complaint_against?: string }>(
  complaints: T[]
): string[] {
  return extractEmployeeIds(complaints, ["created_by", "complaint_against"] as (keyof T)[]);
}
