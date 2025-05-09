"use client";

import {
  createClaimType as cClaimType,
  deleteClaimType as dClaimType,
  getClaimTypes,
  updateClaimType as uClaimType,
} from "@/lib/api/admin-management/claim-settlement";
import { claimTypeSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type ClaimType = z.infer<typeof claimTypeSchema>;

export function useClaimTypes() {
  const [claimTypes, setClaimTypes] = useState<ClaimType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClaimTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClaimTypes();
      setClaimTypes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createClaimType = async (type: ClaimType) => {
    const data = await cClaimType(type);
    return { success: true, status: 200, data };
  };

  const updateClaimType = async (type: ClaimType) => {
    const data = await uClaimType(type);
    return { success: true, status: 200, data };
  };

  const deleteClaimType = async (id: number) => {
    const data = await dClaimType(id);
    return { success: true, status: 200, data };
  };

  return {
    claimTypes,
    loading,
    fetchClaimTypes,
    createClaimType,
    updateClaimType,
    deleteClaimType,
  };
}
