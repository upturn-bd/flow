"use client";

import {
  createProject as cProject,
  deleteProject as dProject,
  getProjects,
  updateProject as uProject,
} from "@/lib/api/operations-and-services/project";
import { projectSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Project = z.infer<typeof projectSchema>;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (project: Project) => {
    const data = await cProject(project);
    return { success: true, status: 200, data };
  };

  const updateProject = async (project: Project) => {
    const data = await uProject(project);
    return { success: true, status: 200, data };
  };

  const deleteProject = async (id: number) => {
    const data = await dProject(id);
    return { success: true, status: 200, data };
  };

  return {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
