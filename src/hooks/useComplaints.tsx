"use client";

import {
  createComplaintType as cComplaintTypes,
  deleteComplaintType as dComplaintTypes,
  getComplaintTypes,
} from "@/lib/api/admin-management/complaints";
import { complaintsTypeSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type ComplaintTypes = z.infer<typeof complaintsTypeSchema>;

export function useComplaintTypes() {
  const [complaintTypes, setComplaintTypes] = useState<ComplaintTypes[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComplaintTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComplaintTypes();
      setComplaintTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createComplaintType = async (type: ComplaintTypes) => {
    const data = await cComplaintTypes(type);
    return { success: true, status: 200, data };
  };

  const deleteComplaintType = async (id: number) => {
    const data = await dComplaintTypes(id);
    return { success: true, status: 200, data };
  };

  return {
    complaintTypes,
    loading,
    fetchComplaintTypes,
    createComplaintType,
    deleteComplaintType,
  };
}
