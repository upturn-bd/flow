"use client";

import { useBaseEntity } from "./core";
import { Grade } from "@/lib/types";

export type { Grade };

export function useGrades() {
  const baseResult = useBaseEntity<Grade>({
    tableName: "grades",
    entityName: "grade",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    grades: baseResult.items,
    fetchGrades: baseResult.fetchItems,
    createGrade: baseResult.createItem,
    updateGrade: baseResult.updateItem,
    deleteGrade: baseResult.deleteItem,
  };
}
