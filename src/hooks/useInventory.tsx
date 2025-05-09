"use client";

import {
  createRequisitionInventory as cRequisitionInventory,
  deleteRequisitionInventory as dRequisitionInventory,
  getRequisitionInventories,
  updateRequisitionInventory as uRequisitionInventory,
} from "@/lib/api/admin-management/inventory";
import { requisitionInventorySchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type RequisitionInventory = z.infer<typeof requisitionInventorySchema>;

export function useRequisitionInventories() {
  const [requisitionInventories, setRequisitionInventories] = useState<RequisitionInventory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequisitionInventories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRequisitionInventories();
      setRequisitionInventories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequisitionInventory = async (inventory: RequisitionInventory) => {
    const data = await cRequisitionInventory(inventory);
    return { success: true, status: 200, data };
  };

  const updateRequisitionInventory = async (inventory: RequisitionInventory) => {
    const data = await uRequisitionInventory(inventory);
    return { success: true, status: 200, data };
  };

  const deleteRequisitionInventory = async (id: number) => {
    const data = await dRequisitionInventory(id);
    return { success: true, status: 200, data };
  };

  return {
    requisitionInventories,
    loading,
    fetchRequisitionInventories,
    createRequisitionInventory,
    updateRequisitionInventory,
    deleteRequisitionInventory,
  };
}
