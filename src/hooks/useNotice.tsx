"use client";

import { useBaseEntity } from "./core";
import { Notice, NoticeType } from "@/lib/types/schemas";

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
    notice: baseResult.item,
    fetchNotices: baseResult.fetchItems,
    fetchNotice: baseResult.fetchItem,
    createNotice: baseResult.createItem,
    deleteNotice: baseResult.deleteItem,
    updateNotice: baseResult.updateItem,
  };
}


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
    noticeType: baseResult.item,  
    newsAndNoticeTypes: baseResult.items,
    fetchNoticeType: baseResult.fetchItem,
    fetchNoticeTypes: baseResult.fetchItems,
    createNoticeType: baseResult.createItem,
    deleteNoticeType: baseResult.deleteItem,
    updateNoticeType: baseResult.updateItem,
  };
}
