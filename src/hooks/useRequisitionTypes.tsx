"use client";

import {
  createRequisitionType as cRequisitionType,
  deleteRequisitionType as dRequisitionType,
  getRequisitionTypes,
} from "@/lib/api/admin-management/inventory";
import { requisitionTypeSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type RequisitionType = z.infer<typeof requisitionTypeSchema>;

export function useRequisitionTypes() {
  const [requisitionTypes, setRequisitionTypes] = useState<RequisitionType[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const fetchRequisitionTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRequisitionTypes();
      setRequisitionTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequisitionType = async (type: RequisitionType) => {
    const data = await cRequisitionType(type);
    return { success: true, status: 200, data };
  };

  const deleteRequisitionType = async (id: number) => {
    const data = await dRequisitionType(id);
    return { success: true, status: 200, data };
  };

  return {
    requisitionTypes,
    loading,
    fetchRequisitionTypes,
    createRequisitionType,
    deleteRequisitionType,
  };
}
