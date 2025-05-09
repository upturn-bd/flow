"use client";

import { useState, useCallback } from "react";

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
      const res = await fetch("/api/company-info/positions");
      const data = await res.json();
      setPositions(data.positions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPosition = async (position: Omit<Position, "id">) => {
    const res = await fetch("/api/company-info/positions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(position),
    });
    return await res.json();
  };

  const updatePosition = async (position: Position) => {
    const res = await fetch("/api/company-info/positions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(position),
    });
    return await res.json();
  };

  const deletePosition = async (id: number) => {
    const res = await fetch(`/api/company-info/positions?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
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
