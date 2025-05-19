"use client";

import { useState, useCallback } from "react";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
} from "@/lib/api/company-info/positions";
import { getUserInfo } from "@/lib/api/company-info/employees"

export type Position = {
  id: number;
  name: string;
  description: string;
  department_id: number;
  grade: number;
};

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getUserInfo();
      const data = await getPositions(user.id);
      setPositions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPositionHandler = async (position: Omit<Position, "id">) => {
    const user = await getUserInfo();
    return await createPosition(user.id, position);
  };

  const updatePositionHandler = async (position: Position) => {
    return await updatePosition(position.id, position);
  };

  const deletePositionHandler = async (id: number) => {
    return await deletePosition(id);
  };

  return {
    positions,
    loading,
    fetchPositions,
    createPosition: createPositionHandler,
    updatePosition: updatePositionHandler,
    deletePosition: deletePositionHandler,
  };
}
