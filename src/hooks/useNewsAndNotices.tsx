"use client";

import {
  createNewsAndNoticeType as cNewsAndNoticesType,
  deleteNewsAndNoticeType as dNewsAndNoticesType,
  getNewsAndNoticeTypes,
} from "@/lib/api/admin-management/news-and-notice";
import { newsAndNoticeTypeSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type NewsAndNoticesType = z.infer<typeof newsAndNoticeTypeSchema>;

export function useNewsAndNoticesTypes() {
  const [newsAndNoticeTypes, setNewsAndNoticesTypes] = useState<
    NewsAndNoticesType[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchNewsAndNoticesTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNewsAndNoticeTypes();
      setNewsAndNoticesTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewsAndNoticesType = async (type: NewsAndNoticesType) => {
    const data = await cNewsAndNoticesType(type);
    return { success: true, status: 200, data };
  };

  const deleteNewsAndNoticesType = async (id: number) => {
    const data = await dNewsAndNoticesType(id);
    return { success: true, status: 200, data };
  };

  return {
    newsAndNoticeTypes,
    loading,
    fetchNewsAndNoticesTypes,
    createNewsAndNoticesType,
    deleteNewsAndNoticesType,
  };
}
