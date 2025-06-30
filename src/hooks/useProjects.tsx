"use client";

import { useBaseEntity } from "./core";
import { Project } from "@/lib/types";

export type { Project };

export function useProjects() {
  const baseResult = useBaseEntity<Project>({
    tableName: "project_records",
    entityName: "project",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    projects: baseResult.items,
    fetchProjects: baseResult.fetchItems,
    createProject: baseResult.createItem,
    updateProject: baseResult.updateItem,
    deleteProject: baseResult.deleteItem,
  };
}
