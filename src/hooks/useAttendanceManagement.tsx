"use client";

import { Site } from "@/lib/types";
import { useBaseEntity } from "./core/useBaseEntity";

// Re-export Site type for components
export type { Site };

// Hook using simplified API pattern
export function useAttendanceManagement() {
  return useBaseEntity<Site>({
    tableName: "sites",
    entityName: "site",
    companyScoped: true,
  });
}

// Backward compatibility hook with legacy property names
export function useSites() {
  const baseResult = useAttendanceManagement();
  
  return {
    ...baseResult,
    sites: baseResult.items,
    fetchSites: baseResult.fetchItems,
    createSite: baseResult.createItem,
    updateSite: baseResult.updateItem,
    deleteSite: baseResult.deleteItem,
  };
}
