"use client";

import { useState, useCallback } from "react";
import {
  getGrades,
  createGrade,
  deleteGrade,
} from "@/lib/api/company-info/grades";
import { getUserInfo } from "@/lib/api/company-info/employees"

export type Grade = {
  id: number;
  name: string;
  company_id: number;
};

export function useGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getUserInfo();
      const data = await getGrades(user.id);
      setGrades(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGradeHandler = async (grade: Omit<Grade, "id">) => {
    const user = await getUserInfo();
    return await createGrade(user.id, grade);
  };

  const deleteGradeHandler = async (id: number) => {
    return await deleteGrade(id);
  };

  return {
    grades,
    loading,
    fetchGrades,
    createGrade: createGradeHandler,
    deleteGrade: deleteGradeHandler,
  };
}
