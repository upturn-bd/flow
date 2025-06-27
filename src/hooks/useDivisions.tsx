"use client";

import { useBaseEntity } from "./core";
import { Division } from "@/lib/types";

export type { Division };

export function useDivisions() {
  const baseResult = useBaseEntity<Division>({
    tableName: "divisions",
    entityName: "division",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    divisions: baseResult.items,
    fetchDivisions: baseResult.fetchItems,
    createDivision: baseResult.createItem,
    updateDivision: baseResult.updateItem,
    deleteDivision: baseResult.deleteItem,
  };
}
