"use client";

import { useState, useCallback } from "react";
import {
  getPositions as fetchPositionsApi,
  createPosition as createPositionApi,
  updatePosition as updatePositionApi,
  deletePosition as deletePositionApi
} from "@/lib/api/company";

export type Position = {
  id: number;
  name: string;
  description?: string;
  department_id?: number;
  grade_id?: number;
  company_id?: string | number;
  created_at?: string;
};

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPositionsApi();
      setPositions(data as Position[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPosition = async (position: Omit<Position, "id" | "company_id" | "created_at">) => {
    try {
      const data = await createPositionApi(position);
      await fetchPositions(); // Refresh list after creating
      return { success: true, data };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const updatePosition = async (position: Position) => {
    try {
      await updatePositionApi(position);
      await fetchPositions(); // Refresh list after updating
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const deletePosition = async (id: number) => {
    try {
      await deletePositionApi(id);
      await fetchPositions(); // Refresh list after deleting
      return { success: true, message: "Position deleted successfully." };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  return {
    positions,
    loading,
    fetchPositions,
    createPosition,
    updatePosition,
    deletePosition,
  };
}
