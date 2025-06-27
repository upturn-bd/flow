"use client";

import { useBaseEntity } from "./core";
import { NoticeType } from "@/lib/types";

export type { NoticeType };

export function useNoticeTypes() {
  const baseResult = useBaseEntity<NoticeType>({
    tableName: "notice_types",
    entityName: "notice type",
    companyScoped: true,
    departmentScoped: true, // Enable department scoping for news and notices
  });
  
  return {
    ...baseResult,
    newsAndNoticeTypes: baseResult.items,
    fetchNewsAndNoticesTypes: baseResult.fetchItems,
    createNewsAndNoticesType: baseResult.createItem,
    deleteNewsAndNoticesType: baseResult.deleteItem,
    updateNewsAndNoticesType: baseResult.updateItem,
  };
}

// Backward compatibility alias
export const useNewsAndNoticesTypes = useNoticeTypes;
