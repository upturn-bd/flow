"use client";

import { useBaseEntity } from "./core";
import { Project } from "@/lib/types";
import { useNotifications } from "./useNotifications";
import { getEmployeeInfo } from "@/lib/utils/auth";
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ProjectDetails } from "@/components/ops/project/ProjectForm";
import { slugify } from "@/lib/utils";

export type { Project };

export function useProjects() {
  const baseResult = useBaseEntity<Project>({
    tableName: "project_records",
    entityName: "project",
    companyScoped: true,
  });

  const { createNotification } = useNotifications();

  // --- STATES ---
  const [ongoingProjects, setOngoingProjects] = useState<ProjectDetails[]>([]);
  const [completedProjects, setCompletedProjects] = useState<ProjectDetails[]>([]);

  const [ongoingLoading, setOngoingLoading] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);

  const [ongoingSearchLoading, setOngoingSearchLoading] = useState(false);
  const [completedSearchLoading, setCompletedSearchLoading] = useState(false);

  // Pagination cursors
  const [lastFetchedOngoingProjectId, setLastFetchedOngoingProjectId] = useState<number | null>(null);
  const [lastFetchedCompletedProjectId, setLastFetchedCompletedProjectId] = useState<number | null>(null);

  const [hasMoreOngoingProjects, setHasMoreOngoingProjects] = useState(true);
  const [hasMoreCompletedProjects, setHasMoreCompletedProjects] = useState(true);

  // --- FETCH ONGOING PROJECTS WITH PAGINATION ---
  const fetchOngoingProjects = useCallback(
    async (limit = 10, reset = false) => {
      try {
        setOngoingLoading(true);
        const user = await getEmployeeInfo();

        let query = supabase
          .from("project_records")
          .select("*")
          .eq("company_id", user.company_id)
          .eq("status", "Ongoing")
          .or(`project_lead_id.eq.${user.id},assignees.cs.{${user.id}},created_by.eq.${user.id}`)
          .order("id", { ascending: true })
          .limit(limit);

        // Cursor-based pagination
        if (!reset && lastFetchedOngoingProjectId) {
          query = query.gt("id", lastFetchedOngoingProjectId);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
          setHasMoreOngoingProjects(false);
          return [];
        }

        setOngoingProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = data.filter((p) => !existingIds.has(p.id));
          return reset ? uniqueNew : [...prev, ...uniqueNew];
        });

        setLastFetchedOngoingProjectId(data[data.length - 1].id);
        setHasMoreOngoingProjects(data.length === limit);

        return data;
      } catch (error) {
        console.error("Error fetching ongoing projects:", error);
        throw error;
      } finally {
        setOngoingLoading(false);
      }
    },
    [lastFetchedOngoingProjectId]
  );

  // --- FETCH COMPLETED PROJECTS WITH PAGINATION ---
  const fetchCompletedProjects = useCallback(
    async (limit = 10, reset = false) => {
      try {
        setCompletedLoading(true);
        const user = await getEmployeeInfo();

        let query = supabase
          .from("project_records")
          .select("*")
          .eq("company_id", user.company_id)
          .eq("status", "Completed")
          .or(`project_lead_id.eq.${user.id},assignees.cs.{${user.id}},created_by.eq.${user.id}`)
          .order("id", { ascending: true })
          .limit(limit);

        // Cursor-based pagination
        if (!reset && lastFetchedCompletedProjectId) {
          query = query.gt("id", lastFetchedCompletedProjectId);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (!data || data.length === 0) {
          setHasMoreCompletedProjects(false);
          return [];
        }

        setCompletedProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = data.filter((p) => !existingIds.has(p.id));
          return reset ? uniqueNew : [...prev, ...uniqueNew];
        });

        setLastFetchedCompletedProjectId(data[data.length - 1].id);
        setHasMoreCompletedProjects(data.length === limit);

        return data;
      } catch (error) {
        console.error("Error fetching completed projects:", error);
        throw error;
      } finally {
        setCompletedLoading(false);
      }
    },
    [lastFetchedCompletedProjectId]
  );

  // --- SEARCH PROJECTS ---
  const searchOngoingProjects = useCallback(
    async (searchTerm: string, limit = 10, companyScopes = false) => {
      try {
        setOngoingSearchLoading(true);
        const user = await getEmployeeInfo();

        let query = supabase
          .from("project_records")
          .select("*")
          .eq("status", "Ongoing")
          .order("id", { ascending: true })
          .limit(limit);

        if (!companyScopes) {
          query = query.or(
            `project_lead_id.eq.${user.id},assignees.cs.{${user.id}},created_by.eq.${user.id}`
          );
        }

        if (searchTerm.trim() !== "") {
          query = query.or(
            `project_title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        setOngoingProjects(data || []);
        return data || [];
      } catch (err) {
        console.error("Error searching ongoing projects:", err);
        return [];
      } finally {
        setOngoingSearchLoading(false);
      }
    },
    []
  );

  const searchCompletedProjects = useCallback(
    async (searchTerm: string, limit = 10, companyScopes = false) => {
      try {
        setCompletedSearchLoading(true);
        const user = await getEmployeeInfo();

        let query = supabase
          .from("project_records")
          .select("*")
          .eq("status", "Completed")
          .order("id", { ascending: true })
          .limit(limit);

        if (!companyScopes) {
          query = query.or(
            `project_lead_id.eq.${user.id},assignees.cs.{${user.id}},created_by.eq.${user.id}`
          );
        }

        if (searchTerm.trim() !== "") {
          query = query.or(
            `project_title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
          );
        }

        const { data, error } = await query;
        if (error) throw error;

        setCompletedProjects(data || []);
        return data || [];
      } catch (err) {
        console.error("Error searching completed projects:", err);
        return [];
      } finally {
        setCompletedSearchLoading(false);
      }
    },
    []
  );

  // --- CREATE PROJECT ---
  const createProject = async (project: Project) => {
    try {
      const user = await getEmployeeInfo();
      const company_id = user.company_id;
      const projectId = slugify(project.project_title);

      const finalData = {
        id: projectId,
        ...project,
        created_by: user.id,
      };

      const result = await baseResult.createItem(finalData);
      const recipients = [...(project.assignees || []), project.project_lead_id].filter(Boolean) as string[];

      // Notifications
      void createNotification({
        title: "New Project Assigned",
        message: `A new project "${project.project_title}" has been assigned to you.`,
        priority: "normal",
        type_id: 3,
        recipient_id: recipients,
        action_url: "/ops/project",
        company_id,
        department_id: user.department_id,
      });

      void createNotification({
        title: "New Project Created",
        message: `A new project "${project.project_title}" has been created by ${user.name}.`,
        priority: "normal",
        type_id: 3,
        recipient_id: [user.supervisor_id].filter(Boolean) as string[],
        action_url: "/ops/project",
        company_id,
        department_id: user.department_id,
      });

      return result;
    } catch (error) {
      console.error("Error creating project:", error);
      throw error;
    }
  };

  // --- UPDATE PROJECT ---
  const updateProject = async (projectId: string, project: Project) => {
    try {
      const user = await getEmployeeInfo();
      const company_id = user.company_id;

      const { data: result, error } = await baseResult.updateItem(projectId, project);
      if (error) throw error;

      const recipients = [...(project.assignees || []), project.project_lead_id, user.supervisor_id].filter(Boolean) as string[];

      createNotification({
        title: "Project Updated",
        message: `The project "${project.project_title}" has been updated by ${user.name}.`,
        priority: "normal",
        type_id: 3,
        recipient_id: recipients,
        action_url: "/ops/project",
        company_id,
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
    completedProjects,

    ongoingLoading,
    completedLoading,

    ongoingSearchLoading,
    completedSearchLoading,

    fetchOngoingProjects,
    fetchCompletedProjects,

    hasMoreOngoingProjects,
    hasMoreCompletedProjects,

    searchOngoingProjects,
    searchCompletedProjects,

    createProject,
    updateProject,
    deleteProject: baseResult.deleteItem,
  };
}
