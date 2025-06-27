"use client";

import { useBaseEntity } from "./core";
import { ClaimType } from "@/lib/types";

export function useClaimAndSettlement() {
  return useBaseEntity<ClaimType>({
    tableName: "claim_types",
    entityName: "claim type",
    companyScoped: true,
  });
}
