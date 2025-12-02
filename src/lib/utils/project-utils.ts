import { Project } from "@/lib/types";

/**
 * Extract all unique employee IDs from a list of projects.
 * This includes project leads, assignees, and creators.
 * Use this to fetch only the employees needed for display.
 */
export function extractEmployeeIdsFromProjects(projects: Project[]): string[] {
  const employeeIds = new Set<string>();

  for (const project of projects) {
    // Add project lead
    if (project.project_lead_id) {
      employeeIds.add(project.project_lead_id);
    }

    // Add all assignees
    if (project.assignees && Array.isArray(project.assignees)) {
      for (const assigneeId of project.assignees) {
        if (assigneeId) {
          employeeIds.add(assigneeId);
        }
      }
    }

    // Add creator
    if (project.created_by) {
      employeeIds.add(project.created_by);
    }
  }

  return Array.from(employeeIds);
}
