"use client";

import { useState, useCallback } from "react";
import { 
  fetchUserEducation as fetchUserEducationApi, 
  fetchUserExperience as fetchUserExperienceApi 
} from "@/lib/api/profile/educationExperience";
import { Education } from "@/hooks/useEducation";
import { Experience } from "@/hooks/useExperience";

export function useEducationExperience() {
  const [userEducations, setUserEducations] = useState<Education[]>([]);
  const [userExperiences, setUserExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserEducation = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserEducationApi(uid);
      setUserEducations(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch education data";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserExperience = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserExperienceApi(uid);
      setUserExperiences(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch experience data";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserData = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch education and experience records in parallel
      const [educationData, experienceData] = await Promise.all([
        fetchUserEducationApi(uid),
        fetchUserExperienceApi(uid)
      ]);
      
      setUserEducations(educationData);
      setUserExperiences(experienceData);
      
      return { educationData, experienceData };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user data";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    userEducations,
    userExperiences,
    loading,
    error,
    fetchUserEducation,
    fetchUserExperience,
    fetchUserData
  };
} 