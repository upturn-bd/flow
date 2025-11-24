"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Notice } from "@/lib/types/schemas";
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/lib/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { getDepartmentEmployeesIds } from "@/lib/utils/company";
import {
  optimisticAdd,
  optimisticUpdate,
  optimisticRemove,
} from "./utils";

interface NoticesContextState {
  // Base state
  notices: Notice[];
  loading: boolean;
  error: string | null;
  dataFetched: boolean;
  fetchNotices: (isGlobal?: boolean) => Promise<Notice[]>;
  refetch: () => Promise<Notice[]>;
  
  // CRUD operations
  createNotice: (notice: Notice) => Promise<Notice | null>;
  updateNotice: (noticeId: number, notice: Notice) => Promise<Notice | null>;
  deleteNotice: (noticeId: number) => Promise<void>;
}

const NoticesContext = createContext<NoticesContextState | undefined>(undefined);

export function NoticesProvider({ children }: { children: React.ReactNode }) {
  const { employeeInfo } = useAuth();
  const { createNotification } = useNotifications();

  // Base state
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState(false);

  // Optimistic update handlers
  const handleOptimisticCreate = useCallback((newNotice: Notice) => {
    setNotices(prev => optimisticAdd(prev, newNotice));
    return newNotice;
  }, []);

  const handleOptimisticUpdate = useCallback((noticeId: number, updates: Notice) => {
    const previousData = notices.find(n => n.id === noticeId);
    setNotices(prev => optimisticUpdate(prev, noticeId, updates));
    return { previousData };
  }, [notices]);

  const handleOptimisticDelete = useCallback((noticeId: number) => {
    const previousData = notices.find(n => n.id === noticeId);
    setNotices(prev => optimisticRemove(prev, noticeId));
    return { previousData };
  }, [notices]);

  // Fetch notices
  const fetchNotices = useCallback(
    async (isGlobal = false): Promise<Notice[]> => {
      if (!employeeInfo) {
        console.warn("Cannot fetch notices: Employee info not available");
        setNotices([]);
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const companyId = employeeInfo.company_id;
        const departmentId = employeeInfo.department_id ?? 0;

        let query = supabase
          .from("notice_records")
          .select("*")
          .eq("company_id", companyId)
          .gte("valid_till", new Date().toISOString())
          .order("created_at", { ascending: false });

        // If not global, apply department/user filters
        if (!isGlobal) {
          query = query.or(
            `department_id.eq.${departmentId},department_id.eq.0,created_by.eq.${employeeInfo.id}`
          );
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const fetchedNotices = data as Notice[];
        setNotices(fetchedNotices);
        setDataFetched(true);

        return fetchedNotices;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch notices";
        setError(errorMessage);
        console.error("Error fetching notices:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [employeeInfo]
  );

  // Create notice
  const createNotice = useCallback(
    async (notice: Notice): Promise<Notice | null> => {
      if (!employeeInfo) {
        console.warn("Cannot create notice: Employee info not available");
        return null;
      }

      const finalData = {
        ...notice,
        department_id: notice.department_id === undefined ? 0 : notice.department_id,
        company_id: parseInt(employeeInfo.company_id!.toString()),
        created_by: employeeInfo.id,
      } as Notice;

      const optimisticNotice = handleOptimisticCreate(finalData);

      try {
        const { data, error } = await supabase
          .from("notice_records")
          .insert([finalData])
          .select()
          .single();

        if (error) throw error;

        // Update with actual data from server
        setNotices((prev) =>
          prev.map((n) => (n.id === optimisticNotice.id ? data : n))
        );

        const recipients = await getDepartmentEmployeesIds(finalData.department_id!);

        createNotification({
          title: "New Notice Published",
          message: `A new notice "${notice.title}" has been published.`,
          priority: notice.urgency || "normal",
          type_id: 6,
          recipient_id: recipients,
          action_url: "/ops/notice",
          company_id: parseInt(employeeInfo.company_id!.toString()),
          department_id: finalData.department_id,
        });

        return data;
      } catch (err) {
        // Rollback on error
        setNotices((prev) => prev.filter((n) => n.id !== optimisticNotice.id));
        console.error("Error creating notice:", err);
        throw err;
      }
    },
    [employeeInfo, createNotification, handleOptimisticCreate]
  );

  // Update notice
  const updateNotice = useCallback(
    async (noticeId: number, updates: Notice): Promise<Notice | null> => {
      if (!employeeInfo) {
        console.warn("Cannot update notice: Employee info not available");
        return null;
      }

      const optimisticData = handleOptimisticUpdate(noticeId, updates);
      if (!optimisticData) return null;

      try {
        const { data, error } = await supabase
          .from("notice_records")
          .update(updates)
          .eq("id", noticeId)
          .select()
          .single();

        if (error) throw error;

        // Update with actual data from server
        setNotices((prev) =>
          prev.map((notice) => (notice.id === noticeId ? data : notice))
        );

        const recipients = await getDepartmentEmployeesIds(updates.department_id || 0);
        
        createNotification({
          title: "Notice Updated",
          message: `The notice "${updates.title}" has been updated.`,
          priority: updates.urgency || "normal",
          type_id: 6,
          recipient_id: recipients,
          action_url: "/ops/notice",
          company_id: parseInt(employeeInfo.company_id!.toString()),
          department_id: updates.department_id,
        });

        return data;
      } catch (err) {
        // Rollback on error
        if (optimisticData.previousData) {
          setNotices((prev) =>
            prev.map((notice) =>
              notice.id === noticeId ? optimisticData.previousData! : notice
            )
          );
        }
        console.error("Error updating notice:", err);
        throw err;
      }
    },
    [employeeInfo, createNotification, handleOptimisticUpdate]
  );

  // Delete notice
  const deleteNotice = useCallback(
    async (noticeId: number): Promise<void> => {
      const optimisticData = handleOptimisticDelete(noticeId);
      if (!optimisticData) return;

      try {
        const { error } = await supabase
          .from("notice_records")
          .delete()
          .eq("id", noticeId);

        if (error) throw error;
      } catch (err) {
        // Rollback on error
        if (optimisticData.previousData) {
          setNotices((prev) => [...prev, optimisticData.previousData!]);
        }
        console.error("Error deleting notice:", err);
        throw err;
      }
    },
    [handleOptimisticDelete]
  );

  const value: NoticesContextState = {
    notices,
    loading,
    error,
    dataFetched,
    fetchNotices,
    refetch: () => fetchNotices(),
    createNotice,
    updateNotice,
    deleteNotice,
  };

  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>;
}

export function useNoticesContext() {
  const context = useContext(NoticesContext);
  if (context === undefined) {
    throw new Error("useNoticesContext must be used within a NoticesProvider");
  }

  // Auto-fetch on first access if not already fetched
  if (!context.dataFetched && !context.loading) {
    context.fetchNotices();
  }

  return context;
}
