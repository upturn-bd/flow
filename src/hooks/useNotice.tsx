"use client";

import { useBaseEntity } from "./core";
import { Notice, NoticeType } from "@/lib/types/schemas";
import { useNotifications } from "./useNotifications";
import { getCompanyId, getEmployeeInfo } from "@/lib/utils/auth";
import { getDepartmentEmployeesIds } from "@/lib/utils/company";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";

export type { Notice };

export function useNotices() {
  const baseResult = useBaseEntity<Notice>({
    tableName: "notice_records",
    entityName: "notice",
    companyScoped: true,
    departmentScoped: true,
  });

  const { createNotification } = useNotifications();

  // local state for fetched notices
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  const createNotice = async (notice: Notice) => {
    setLoading(true);
    try {
      const user = await getEmployeeInfo();

      if (notice.department_id === undefined) notice.department_id = 0;
      notice.company_id = await getCompanyId();
      notice.created_by = user.id;

      const result = await baseResult.createItem(notice);

      const recipients = await getDepartmentEmployeesIds(notice.department_id);

      createNotification({
        title: "New Notice Published",
        message: `A new notice "${notice.title}" has been published.`,
        priority: notice.urgency || "normal",
        type_id: 6,
        recipient_id: recipients,
        action_url: "/ops/notice",
        company_id: user.company_id,
        department_id: notice.department_id,
      });

      return result;
    } catch (error) {
      console.error("Error creating notice:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateNotice = async (noticeId: number, notice: Notice) => {
    setLoading(true);
    try {
      const result = await baseResult.updateItem(noticeId, notice);

      const recipients = await getDepartmentEmployeesIds(
        notice.department_id || 0
      );
      const user = await getEmployeeInfo();
      createNotification({
        title: "Notice Updated",
        message: `The notice "${notice.title}" has been updated.`,
        priority: notice.urgency || "normal",
        type_id: 6,
        recipient_id: recipients,
        action_url: "/ops/notice",
        company_id: user.company_id,
        department_id: notice.department_id,
      });

      return result;
    } catch (error) {
      console.error("Error updating notice:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchNotices = async (isGlobal = false): Promise<Notice[]> => {
    setLoading(true);
    try {
      const companyId = await getCompanyId();
      const user = await getEmployeeInfo();
      const departmentId = user.department_id ?? 0;

      let query = supabase
        .from("notice_records")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      // If not global, apply department/user filters
      if (!isGlobal) {
        query = query.or(
          `department_id.eq.${departmentId},department_id.eq.0,created_by.eq.${user.id}`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      const fetchedNotices = data as Notice[];
      setNotices(fetchedNotices);

      return fetchedNotices;
    } catch (error) {
      console.error("Error fetching notices:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  return {
    ...baseResult,
    notices, // updated state
    notice: baseResult.item,
    fetchNotices, // custom function
    fetchNotice: baseResult.fetchItem,
    createNotice,
    deleteNotice: baseResult.deleteItem,
    updateNotice,
    loading, // expose loading
  };
}

export type { NoticeType };

export function useNoticeTypes() {
  const baseResult = useBaseEntity<NoticeType>({
    tableName: "notice_types",
    entityName: "notice type",
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
