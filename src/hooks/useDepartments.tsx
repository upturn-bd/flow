"use client";

import { useBaseEntity } from "./core";
import { Department } from "@/lib/types";

export type { Department };

export function useDepartments() {
  const baseResult = useBaseEntity<Department>({
    tableName: "departments",
    entityName: "department",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    departments: baseResult.items,
    fetchDepartments: baseResult.fetchItems,
    createDepartment: baseResult.createItem,
    updateDepartment: baseResult.updateItem,
    deleteDepartment: baseResult.deleteItem,
  };
}
