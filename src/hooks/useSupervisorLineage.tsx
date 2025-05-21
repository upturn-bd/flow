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
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  const createLineage = async (lineage: z.infer<typeof lineageSchema>[]) => {
    setCreating(true);
    try {
      const data = await cLineage(lineage);
      return { success: true, status: 200, data };
    } catch (error) {
      console.error("Error creating lineage:", error);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const updateLineage = async (lineage: z.infer<typeof lineageSchema>[]) => {
    setUpdating(true);
    try {
      const data = await uLineage(lineage);
      return { success: true, status: 200, data };
    } catch (error) {
      console.error("Error updating lineage:", error);
      throw error;
    } finally {
      setUpdating(false);
    }
  };

  const deleteLineage = async (name: string) => {
    try {
      const data = await dLineage(name);
      return { success: true, status: 200, data };
    } catch (error) {
      console.error("Error deleting lineage:", error);
      throw error;
    }
  };

  return {
    lineages,
    loading,
    creating,
    updating,
    fetchLineages,
    createLineage,
    deleteLineage,
    updateLineage,
  };
}
