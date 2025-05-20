"use client";

import { useState, useCallback } from "react";
import {
  getGrades as fetchGradesApi,
  createGrade as createGradeApi,
  deleteGrade as deleteGradeApi
} from "@/lib/api/company";

export type Grade = {
  id: number;
  name: string;
  company_id: number;
  level?: number;
  description?: string;
  created_at?: string;
};

export function useGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGradesApi();
      setGrades(data as Grade[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGrade = async (grade: Omit<Grade, "id" | "company_id" | "created_at">) => {
    try {
      const data = await createGradeApi(grade);
      await fetchGrades(); // Refresh list after creating
      return { success: true, data };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  const deleteGrade = async (id: number) => {
    try {
      await deleteGradeApi(id);
      await fetchGrades(); // Refresh list after deleting
      return { success: true, message: "Grade deleted successfully." };
    } catch (error) {
      console.error(error);
      return { success: false, error };
    }
  };

  return {
    grades,
    loading,
    fetchGrades,
    createGrade,
    deleteGrade,
  };
}
