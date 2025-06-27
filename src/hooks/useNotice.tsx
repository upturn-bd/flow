"use client";

import { useBaseEntity } from "./core/useBaseEntity";
import { Notice, NoticeType } from "@/lib/types";

export type { Notice };

export function useNotices() {
  const baseResult = useBaseEntity<Notice>({
    tableName: "notice_records",
    entityName: "notice",
    companyScoped: true,
    departmentScoped: true, // Enable department scoping for notices
  });
  
  return {
    ...baseResult,
    notices: baseResult.items,
    fetchNotices: baseResult.fetchItems,
    createNotice: baseResult.createItem,
    updateNotice: baseResult.updateItem,
    deleteNotice: baseResult.deleteItem,
  };
}

export function useNoticesTypes() {
  const baseResult = useBaseEntity<NoticeType>({
    tableName: "notice_types",
    entityName: "notice type",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    noticeTypes: baseResult.items,
    fetchNoticeTypes: baseResult.fetchItems,
  };
}
