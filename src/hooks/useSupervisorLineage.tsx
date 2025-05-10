"use client";

import {
  createLineage as cLineage,
  deleteLineage as dLineage,
  getLineages,
  updateLineage as uLineage,
} from "@/lib/api/admin-management/supervisor-lineage";
import { lineageSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Lineage = z.infer<typeof lineageSchema>;

export function useLineage() {
  const [lineages, setLineages] = useState<Lineage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLineages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLineages();
      setLineages(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLineage = async (lineage: Omit<Lineage, "id">[]) => {
    const data = await cLineage(lineage);
    return { success: true, status: 200, data };
  };

  const updateLineage = async (lineage: Omit<Lineage, "id">[]) => {
    const data = await uLineage(lineage);
    return { success: true, status: 200, data };
  };

  const deleteLineage = async (name: string) => {
    const data = await dLineage(name);
    return { success: true, status: 200, data };
  };

  return {
    lineages,
    loading,
    fetchLineages,
    createLineage,
    deleteLineage,
    updateLineage,
  };
}
