"use client";

import { useBaseEntity } from "./core";
import { Notice } from "@/lib/types/schemas";

export type { Notice };

export function useNotices() {
  const baseResult = useBaseEntity<Notice>({
    tableName: "notice_records",
    entityName: "notice",
    companyScoped: true,
    departmentScoped: true,
  });
  
  return {
    ...baseResult,
    notices: baseResult.items,
    fetchNotices: baseResult.fetchItems,
    createNotice: baseResult.createItem,
    deleteNotice: baseResult.deleteItem,
    updateNotice: baseResult.updateItem,
  };
}
