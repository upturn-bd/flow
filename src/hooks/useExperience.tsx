"use client";

import { useBaseEntity } from "./core";
import { Experience } from "@/lib/types";

export type { Experience };

export function useExperience() {
  const baseResult = useBaseEntity<Experience>({
    tableName: "experience",
    entityName: "experience",
    userScoped: true,
  });
  
  return {
    ...baseResult,
    experience: baseResult.items,
    fetchExperience: baseResult.fetchItems,
    createExperience: baseResult.createItem,
    updateExperience: baseResult.updateItem,
    deleteExperience: baseResult.deleteItem,
  };
}
