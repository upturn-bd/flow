"use client";

import { RequisitionType } from "@/lib/types";
import { useBaseEntity } from "./core/useBaseEntity";

// Re-export RequisitionType for components
export type { RequisitionType };

// Hook using simplified API pattern
export function useRequisitionTypes() {
  return useBaseEntity<RequisitionType>({
    tableName: "requisition_types",
    entityName: "requisition type",
    companyScoped: true,
  });
}
