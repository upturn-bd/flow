"use client";

import {
  createSchooling,
  deleteSchooling,
  getSchoolings,
  updateSchooling,
} from "@/lib/api/hris";
import { schoolingSchema } from "@/lib/types";
import { useState, useCallback } from "react";
import { z } from "zod";

export type Education = z.infer<typeof schoolingSchema>;

export function useEducation() {
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEducation = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSchoolings();
      setEducation(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEducation = async (education: Omit<Education, "id">) => {
    const data = await createSchooling(education);
    return { success: true, status: 200, data };
  };

  const updateEducation = async (education: Education) => {
    const data = await updateSchooling(education);
    return { success: true, status: 200, data };
  };

  const deleteEducation = async (id: number) => {
    const data = await deleteSchooling(id);
    return { success: true, status: 200, data };
  };

  return {
    education,
    loading,
    fetchEducation,
    createEducation,
    updateEducation,
    deleteEducation,
  };
}
