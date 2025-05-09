"use client";

import { useState, useCallback } from "react";

export type Division = {
  id: number;
  name: string;
  head_id: string;
};

export function useDivisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDivisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/company-info/divisions");
      const data = await res.json();
      setDivisions(data.divisions || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDivision = async (division: Omit<Division, "id">) => {
    const res = await fetch("/api/company-info/divisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(division),
    });
    return await res.json();
  };

  const updateDivision = async (division: Division) => {
    const res = await fetch("/api/company-info/divisions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(division),
    });
    return await res.json();
  };

  const deleteDivision = async (id: number) => {
    const res = await fetch(`/api/company-info/divisions?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
  };

  return {
    divisions,
    loading,
    fetchDivisions,
    createDivision,
    updateDivision,
    deleteDivision,
  };
}
