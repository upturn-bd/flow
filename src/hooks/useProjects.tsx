"use client";

import { useState, useCallback } from "react";
import { 
  getProjects as fetchProjectsApi, 
  createProject as createProjectApi, 
  updateProject as updateProjectApi, 
  deleteProject as deleteProjectApi 
} from "@/lib/api/operations-and-services/project";
import { projectSchema } from "@/lib/types";
import { z } from "zod";

export type Project = z.infer<typeof projectSchema>;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjectsApi();
      setProjects(data as Project[]);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (project: Project) => {
    try {
      const data = await createProjectApi(project);
      await fetchProjects(); // Refresh list after creating
      return { success: true, data };
    } catch (err) {
      console.error("Error creating project:", err);
      return { success: false, error: err };
    }
  };

  const updateProject = async (project: Project) => {
    try {
      await updateProjectApi(project);
      await fetchProjects(); // Refresh list after updating
      return { success: true };
    } catch (err) {
      console.error("Error updating project:", err);
      return { success: false, error: err };
    }
  };

  const deleteProject = async (id: number) => {
    try {
      await deleteProjectApi(id);
      await fetchProjects(); // Refresh list after deleting
      return { success: true };
    } catch (err) {
      console.error("Error deleting project:", err);
      return { success: false, error: err };
    }
  };

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  };
}
