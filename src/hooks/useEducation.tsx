"use client";

import { useBaseEntity } from "./core";
import { Schooling } from "@/lib/types";

export type { Schooling as Education };

export function useEducation() {
  const baseResult = useBaseEntity<Schooling>({
    tableName: "education",
    entityName: "education",
    userScoped: true,
  });
  
  return {
    ...baseResult,
    education: baseResult.items,
    fetchEducation: baseResult.fetchItems,
    createEducation: baseResult.createItem,
    updateEducation: baseResult.updateItem,
    deleteEducation: baseResult.deleteItem,
  };
}
