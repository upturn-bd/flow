"use client";

import { useBaseEntity } from "./core";
import { Milestone } from "@/lib/types";

export type { Milestone };

export function useMilestones() {
  const baseResult = useBaseEntity<Milestone>({
    tableName: "milestones",
    entityName: "milestone",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    milestones: baseResult.items,
    fetchMilestones: baseResult.fetchItems,
    createMilestone: baseResult.createItem,
    updateMilestone: baseResult.updateItem,
    deleteMilestone: baseResult.deleteItem,
  };
}
