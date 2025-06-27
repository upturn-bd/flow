"use client";

import { useBaseEntity } from "./core";
import { RequisitionInventory } from "@/lib/types";

export function useInventory() {
  return useBaseEntity<RequisitionInventory>({
    tableName: "requisition_inventory",
    entityName: "inventory item",
    companyScoped: true,
  });
}
