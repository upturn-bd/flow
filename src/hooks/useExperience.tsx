"use client";

import {
  createExperience as cExperience,
  deleteExperience as dExperience,
  getExperiences,
  updateExperience as uExperience,
} from "@/lib/api/hris";
import { Experience as ExperienceType } from "@/lib/types";
import { useState, useCallback } from "react";

export type Experience = ExperienceType;

export function useExperience() {
  const [experience, setExperience] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExperience = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getExperiences();
      setExperience(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createExperience = async (experience: Omit<Experience, "id">) => {
    const data = await cExperience(experience);
    return { success: true, status: 200, data };
  };

  const updateExperience = async (experience: Experience) => {
    const data = await uExperience(experience);
    return { success: true, status: 200, data };
  };

  const deleteExperience = async (id: number) => {
    const data = await dExperience(id);
    return { success: true, status: 200, data };
  };

  return {
    experience,
    loading,
    fetchExperience,
    createExperience,
    updateExperience,
    deleteExperience,
  };
}
