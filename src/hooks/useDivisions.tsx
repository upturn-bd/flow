"use client";

import { useState, useCallback } from "react";
import {
  getDivisions as fetchDivisionsApi,
  createDivision as createDivisionApi,
  updateDivision as updateDivisionApi,
  deleteDivision as deleteDivisionApi
} from "@/lib/api/company/divisions";

// Define Division type that matches both API and UI needs
export type Division = {
  id?: number;
  name: string;
  head_id?: string;
  company_id?: string | number;
  created_at?: string;
};

export function useDivisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDivisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDivisionsApi();
      setDivisions(data as Division[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDivision = async (division: Omit<Division, "id" | "company_id" | "created_at">) => {
    try {
      const data = await createDivisionApi(division);
      await fetchDivisions(); // Refresh list after creating
      return { success: true, data };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const updateDivision = async (division: Division) => {
    try {
      await updateDivisionApi({ id: division.id!, ...division });
      await fetchDivisions(); // Refresh list after updating
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const deleteDivision = async (id: number) => {
    try {
      await deleteDivisionApi(id);
      await fetchDivisions(); // Refresh list after deleting
      return { success: true, message: "Division deleted successfully." };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
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
