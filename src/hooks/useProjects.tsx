"use client";

import { useBaseEntity } from "./core";
import { Project } from "@/lib/types";
import { useNotifications } from "./useNotifications";
import { getEmployeeInfo, getUser, getUserId } from "@/lib/utils/auth";
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ProjectDetails } from "@/components/operations-and-services/project/ProjectForm";

export type { Project };

export function useProjects() {
  const baseResult = useBaseEntity<Project>({
    tableName: "project_records",
    entityName: "project",
    companyScoped: true,
  });

  const { createNotification } = useNotifications();

  const [ongoingProjects, setOngoingProjects] = useState<ProjectDetails[]>([]);

  const [ongoingLoading, setOngoingLoading] = useState(false);

  // Wrap createProject to include notification creation

  const fetchOngoingProjects = async () => {
    try {
      setOngoingLoading(true)
      const user = await getEmployeeInfo();

      const { data, error } = await supabase
        .from("project_records")
        .select("*")
        .eq("company_id", user.company_id)
        .eq("status", "Ongoing")
        .or(
          `project_lead_id.eq.${user.id},assignees.cs.{${user.id}},created_by.eq.${user.id}`
        );


      if (error) throw error;

      console.log(data)

      setOngoingProjects(data)

      setOngoingLoading(false)
      return data

    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const createProject = async (project: Project) => {
    try {
      const user = await getEmployeeInfo();
      const company_id = user.company_id;
      const finalData = {
        ...project,
        created_by: user.id
      }
      console.log("Step 2", finalData)
      const result = await baseResult.createItem(finalData);
      const recipients = [...(project.assignees || []), project.project_lead_id].filter(Boolean) as string[];




      void createNotification({
        title: "New Project Assigned",
        message: `A new project "${project.project_title}" has been assigned to you.`,
        priority: 'normal',
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: recipients,
        action_url: '/operations-and-services/workflow/project',
        company_id: company_id,
        department_id: user.department_id
      });

      void createNotification({
        title: "New Project Created",
        message: `A new project "${project.project_title}" has been created by ${user.name}.`,
        priority: 'normal',
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: [user.supervisor_id].filter(Boolean) as string[],
        action_url: '/operations-and-services/workflow/project',
        company_id: company_id,
        department_id: user.department_id
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

      console.log("Completing project", projectId, project)

      const { data: result, error } = await baseResult.updateItem(projectId, project);
      if (error) {
        console.log(error)
        throw error;
      }
      const recipients = [...(project.assignees || []), project.project_lead_id, user.supervisor_id].filter(Boolean) as string[];


      createNotification({
        title: "Project Updated",
        message: `The project "${project.project_title}" has been updated by ${user.name}.`,
        priority: 'normal',
        type_id: 3, // Assuming 3 is the type ID for task assignment
        recipient_id: recipients,
        action_url: '/operations-and-services/workflow/project',
        company_id: company_id,
      });

      return result;
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  };

  return {
    ...baseResult,
    ongoingProjects,
    ongoingLoading,
    fetchOngoingProjects,
    projects: baseResult.items,
    fetchProjects: baseResult.fetchItems,
    createProject,
    updateProject,
    deleteProject: baseResult.deleteItem,
  };
}
