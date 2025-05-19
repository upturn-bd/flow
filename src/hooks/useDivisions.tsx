"use client";

import { useState, useCallback, useContext } from "react";
import {
  getDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
} from "@/lib/api/company-info/divisions";
import { AuthContext } from "@/lib/auth/auth-provider";

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
      const { employee } = useContext(AuthContext)!;
      const data = await getDivisions(employee!.id);
      setDivisions(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDivisionHandler = async (division: Omit<Division, "id">) => {
    const { employee } = useContext(AuthContext)!;
    return await createDivision(employee!.id, division);
  };

  const updateDivisionHandler = async (division: Division) => {
    return await updateDivision(division.id, division);
  };

  const deleteDivisionHandler = async (id: number) => {
    return await deleteDivision(id);
  };

  return {
    divisions,
    loading,
    fetchDivisions,
    createDivision: createDivisionHandler,
    updateDivision: updateDivisionHandler,
    deleteDivision: deleteDivisionHandler,
  };
}
