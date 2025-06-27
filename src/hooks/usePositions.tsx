"use client";

import { useBaseEntity } from "./core";
import { Position } from "@/lib/types";

export type { Position };

export function usePositions() {
  const baseResult = useBaseEntity<Position>({
    tableName: "positions",
    entityName: "position",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    positions: baseResult.items,
    fetchPositions: baseResult.fetchItems,
    createPosition: baseResult.createItem,
    updatePosition: baseResult.updateItem,
    deletePosition: baseResult.deleteItem,
  };
}
