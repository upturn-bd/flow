"use client";

import { useBaseEntity } from "./core";
import { Project } from "@/lib/types";
import { useNotifications } from "./useNotifications";
import { getEmployeeInfo, getUser, getUserId } from "@/lib/utils/auth";
import { useCallback } from "react";

export type { Project };

export function useProjects() {
  const baseResult = useBaseEntity<Project>({
    tableName: "project_records",
    entityName: "project",
    companyScoped: true,
  });

  const { createNotification } = useNotifications();

  // Wrap createProject to include notification creation

  const createProject = async (project: Project) => {
    try {
      const user = await getEmployeeInfo();
      const company_id = user.company_id;
      const result = await baseResult.createItem(project);

      const recipients = [...(project.assignees || []), project.project_lead_id].filter(Boolean) as string[];

      console.log(project.company_id, project.department_id, 'company and department');

      createNotification({
        title: "New Project Assigned",
        message: `A new project "${project.project_title}" has been assigned to you.`,
        priority: 'normal',
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: recipients,
        action_url: '/operations-and-services/workflow/project',
        company_id: company_id,
        department_id: project.department_id
      });

      createNotification({
        title: "New Project Created",
        message: `A new project "${project.project_title}" has been created by ${user.name}.`,
        priority: 'normal',
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: [user.supervisor_id].filter(Boolean) as string[],
        action_url: '/operations-and-services/workflow/project',
        company_id: company_id,
        department_id: project.department_id
      });
      return result;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  const updateProject = async (projectId: number, project: Project) => {
    try {
      const user = await getEmployeeInfo();
      const company_id = user.company_id;

      const result = await baseResult.updateItem(projectId, project);

      const recipients = [...(project.assignees || []), project.project_lead_id, user.supervisor_id].filter(Boolean) as string[];


      createNotification({
        title: "Project Updated",
        message: `The project "${project.project_title}" has been updated by ${user.name}.`,
        priority: 'normal',
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: recipients,
        action_url: '/operations-and-services/workflow/project',
        company_id: company_id,
        department_id: project.department_id
      });

      return result;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  };

  return {
    ...baseResult,
    projects: baseResult.items,
    fetchProjects: baseResult.fetchItems,
    createProject,
    updateProject,
    deleteProject: baseResult.deleteItem,
  };
}
