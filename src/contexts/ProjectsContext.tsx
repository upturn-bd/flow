"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Project } from "@/lib/types";
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { slugify } from "@/lib/utils";
import { ProjectDetails } from "@/components/ops/project/ProjectForm";
import {
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
} from "./utils";

interface ProjectsContextState {
  // Base state
  projects: Project[];
  loading: boolean;
  error: string | null;
  dataFetched: boolean;
  fetchProjects: () => Promise<Project[]>;
  refetch: () => Promise<Project[]>;
  

  // Custom project-specific states
  ongoingProjects: ProjectDetails[];
  completedProjects: ProjectDetails[];
  ongoingLoading: boolean;
  completedLoading: boolean;
  ongoingSearchLoading: boolean;
  completedSearchLoading: boolean;
  hasMoreOngoingProjects: boolean;
  hasMoreCompletedProjects: boolean;

  // Custom project-specific methods
  fetchOngoingProjects: (limit?: number, reset?: boolean) => Promise<Project[]>;
  fetchCompletedProjects: (limit?: number, reset?: boolean) => Promise<Project[]>;
  searchOngoingProjects: (searchTerm: string, limit?: number, companyScopes?: boolean) => Promise<Project[]>;
  searchCompletedProjects: (searchTerm: string, limit?: number, companyScopes?: boolean) => Promise<Project[]>;
  createProject: (project: Project) => Promise<Project | null>;
  updateProject: (projectId: string, project: Project) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextState | undefined>(undefined);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { employeeInfo } = useAuth();
  const { createNotification } = useNotifications();

  // Base state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Custom states for ongoing/completed projects
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

  // Optimistic update handlers - simplified version
  const handleOptimisticCreate = useCallback((newProject: Project) => {
    setProjects(prev => optimisticAdd(prev, newProject));
    return newProject;
  }, []);

  const handleOptimisticUpdate = useCallback((projectId: string, updates: Project) => {
    const previousData = projects.find(p => p.id === projectId);
    setProjects(prev => optimisticUpdate(prev, projectId, updates));
    return { previousData };
  }, [projects]);

  const handleOptimisticDelete = useCallback((projectId: string) => {
    const previousData = projects.find(p => p.id === projectId);
    setProjects(prev => optimisticRemove(prev, projectId));
    return { previousData };
  }, [projects]);


  // Base fetch all projects
  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    if (!employeeInfo?.company_id) {
      console.warn("Cannot fetch projects: No company context");
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("project_records")
        .select("*")
        .eq("company_id", employeeInfo.company_id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setProjects(data || []);
      setDataFetched(true);
      return data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch projects";
      setError(errorMessage);
      console.error("Error fetching projects:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [employeeInfo?.company_id]);

  // Fetch ongoing projects with pagination
  const fetchOngoingProjects = useCallback(
    async (limit = 10, reset = false): Promise<Project[]> => {
      if (!employeeInfo) {
        return [];
      }
      setOngoingLoading(true);

      try {
        let query = supabase
          .from("project_records")
          .select("*")
          .eq("company_id", employeeInfo.company_id)
          .eq("status", "Ongoing")
          .or(`project_lead_id.eq.${employeeInfo.id},assignees.cs.{${employeeInfo.id}},created_by.eq.${employeeInfo.id}`)
          .order("id", { ascending: true })
          .limit(limit);

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
    [lastFetchedOngoingProjectId, employeeInfo]
  );

  // Fetch completed projects with pagination
  const fetchCompletedProjects = useCallback(
    async (limit = 10, reset = false): Promise<Project[]> => {
      if (!employeeInfo) {
        return [];
      }
      setCompletedLoading(true);

      try {
        let query = supabase
          .from("project_records")
          .select("*")
          .eq("company_id", employeeInfo.company_id)
          .eq("status", "Completed")
          .or(`project_lead_id.eq.${employeeInfo.id},assignees.cs.{${employeeInfo.id}},created_by.eq.${employeeInfo.id}`)
          .order("id", { ascending: true })
          .limit(limit);

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
    [lastFetchedCompletedProjectId, employeeInfo]
  );

  // Search ongoing projects
  const searchOngoingProjects = useCallback(
    async (searchTerm: string, limit = 10, companyScopes = false): Promise<Project[]> => {
      if (!employeeInfo) {
        return [];
      }
      setOngoingSearchLoading(true);

      try {
        let query = supabase
          .from("project_records")
          .select("*")
          .eq("status", "Ongoing")
          .order("id", { ascending: true })
          .limit(limit);

        if (!companyScopes) {
          query = query.or(
            `project_lead_id.eq.${employeeInfo.id},assignees.cs.{${employeeInfo.id}},created_by.eq.${employeeInfo.id}`
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
    [employeeInfo]
  );

  // Search completed projects
  const searchCompletedProjects = useCallback(
    async (searchTerm: string, limit = 10, companyScopes = false): Promise<Project[]> => {
      if (!employeeInfo) {
        return [];
      }
      setCompletedSearchLoading(true);

      try {
        let query = supabase
          .from("project_records")
          .select("*")
          .eq("status", "Completed")
          .order("id", { ascending: true })
          .limit(limit);

        if (!companyScopes) {
          query = query.or(
            `project_lead_id.eq.${employeeInfo.id},assignees.cs.{${employeeInfo.id}},created_by.eq.${employeeInfo.id}`
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
    [employeeInfo]
  );

  // Create project
  const createProject = useCallback(
    async (project: Project): Promise<Project | null> => {
      if (!employeeInfo) {
        console.warn("Cannot create project: Employee info not available");
        return null;
      }

      const company_id = employeeInfo.company_id;
      const projectId = slugify(project.project_title);

      const finalData = {
        id: projectId,
        ...project,
        company_id,
        created_by: employeeInfo.id,
      } as Project;

      const optimisticProject = handleOptimisticCreate(finalData);

      try {
        const { data, error } = await supabase
          .from("project_records")
          .insert([finalData])
          .select()
          .single();

        if (error) throw error;

        // Update with actual data from server
        setProjects((prev) =>
          prev.map((p) => (p.id === optimisticProject.id ? data : p))
        );

        const recipients = [
          ...(project.assignees || []),
          project.project_lead_id,
        ].filter(Boolean) as string[];

        // Send notifications
        void createNotification({
          title: "New Project Assigned",
          message: `A new project "${project.project_title}" has been assigned to you.`,
          priority: "normal",
          type_id: 3,
          recipient_id: recipients,
          action_url: "/ops/project",
          company_id: typeof company_id === "string" ? parseInt(company_id) : company_id!,
          department_id:
            typeof employeeInfo.department_id === "string"
              ? parseInt(employeeInfo.department_id)
              : employeeInfo.department_id,
        });

        void createNotification({
          title: "New Project Created",
          message: `A new project "${project.project_title}" has been created by ${employeeInfo.name}.`,
          priority: "normal",
          type_id: 3,
          recipient_id: [employeeInfo.supervisor_id].filter(Boolean) as string[],
          action_url: "/ops/project",
          company_id: typeof company_id === "string" ? parseInt(company_id) : company_id!,
          department_id:
            typeof employeeInfo.department_id === "string"
              ? parseInt(employeeInfo.department_id)
              : employeeInfo.department_id,
        });

        return data;
      } catch (error) {
        // Rollback on error
        setProjects((prev) => prev.filter((p) => p.id !== optimisticProject.id));
        console.error("Error creating project:", error);
        throw error;
      }
    },
    [employeeInfo, createNotification, handleOptimisticCreate]
  );

  // Update project
  const updateProject = useCallback(
    async (projectId: string, updates: Project): Promise<Project | null> => {
      if (!employeeInfo) {
        console.warn("Cannot update project: Employee info not available");
        return null;
      }

      const optimisticData = handleOptimisticUpdate(projectId, updates);
      if (!optimisticData) return null;

      try {
        const { data, error } = await supabase
          .from("project_records")
          .update(updates)
          .eq("id", projectId)
          .select()
          .single();

        if (error) throw error;

        // Update with actual data from server
        setProjects((prev) =>
          prev.map((project) => (project.id === projectId ? data : project))
        );

        const company_id = employeeInfo.company_id;
        const recipients = [
          ...(updates.assignees || []),
          updates.project_lead_id,
          employeeInfo.supervisor_id,
        ].filter(Boolean) as string[];

        createNotification({
          title: "Project Updated",
          message: `The project "${updates.project_title}" has been updated by ${employeeInfo.name}.`,
          priority: "normal",
          type_id: 3,
          recipient_id: recipients,
          action_url: "/ops/project",
          company_id: typeof company_id === "string" ? parseInt(company_id) : company_id!,
        });

        return data;
      } catch (error) {
        // Rollback on error
        if (optimisticData.previousData) {
          setProjects((prev) =>
            prev.map((project) =>
              project.id === projectId ? optimisticData.previousData! : project
            )
          );
        }
        console.error("Error updating project:", error);
        throw error;
      }
    },
    [employeeInfo, createNotification, handleOptimisticUpdate]
  );

  // Delete project
  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      const optimisticData = handleOptimisticDelete(projectId);
      if (!optimisticData) return;

      try {
        const { error } = await supabase
          .from("project_records")
          .delete()
          .eq("id", projectId);

        if (error) throw error;
      } catch (error) {
        // Rollback on error
        if (optimisticData.previousData) {
          setProjects((prev) => [...prev, optimisticData.previousData!]);
        }
        console.error("Error deleting project:", error);
        throw error;
      }
    },
    [handleOptimisticDelete]
  );

  const value: ProjectsContextState = {
    projects,
    loading,
    error,
    dataFetched,
    fetchProjects,
    refetch: fetchProjects,
    
    // Custom project-specific
    ongoingProjects,
    completedProjects,
    ongoingLoading,
    completedLoading,
    ongoingSearchLoading,
    completedSearchLoading,
    hasMoreOngoingProjects,
    hasMoreCompletedProjects,
    fetchOngoingProjects,
    fetchCompletedProjects,
    searchOngoingProjects,
    searchCompletedProjects,
    createProject,
    updateProject,
    deleteProject,
  };

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjectsContext() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error("useProjectsContext must be used within a ProjectsProvider");
  }

  // Auto-fetch on first access if not already fetched
  if (!context.dataFetched && !context.loading) {
    context.fetchProjects();
  }

  return context;
}
