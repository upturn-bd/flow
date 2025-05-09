"use client";

import { useState, useCallback } from "react";

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
      const res = await fetch("/api/company-info/grades");
      const data = await res.json();
      setGrades(data.grades || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGrade = async (grade: Omit<Grade, "id">) => {
    const res = await fetch("/api/company-info/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(grade),
    });
    return await res.json();
  };

  const deleteGrade = async (id: number) => {
    const res = await fetch(`/api/company-info/grades?id=${id}`, {
      method: "DELETE",
    });
    return await res.json();
  };

  return {
    grades,
    loading,
    fetchGrades,
    createGrade,
    deleteGrade,
  };
}
