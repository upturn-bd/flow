"use client";

import {
  createNotice as cNotice,
  deleteNotice as dNotice,
  getNotices,
  updateNotice as uNotice,
} from "@/lib/api/operations-and-services/notice";
import { noticeSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Notice = z.infer<typeof noticeSchema>;

export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNotice = async (notice: Notice) => {
    const data = await cNotice(notice);
    return { success: true, status: 200, data };
  };

  const updateNotice = async (notice: Notice) => {
    const data = await uNotice(notice);
    return { success: true, status: 200, data };
  };

  const deleteNotice = async (id: number) => {
    const data = await dNotice(id);
    return { success: true, status: 200, data };
  };

  return {
    notices,
    loading,
    fetchNotices,
    createNotice,
    updateNotice,
    deleteNotice,
  };
}
