"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Schooling, Experience } from "@/lib/types/schemas";

export function useEducationExperience() {
  const [userEducations, setUserEducations] = useState<Schooling[]>([]);
  const [userExperiences, setUserExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserEducation = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('schoolings')
        .select('*')
        .eq('employee_id', uid);

      if (error) throw error;
      
      const educationData = data || [];
      setUserEducations(educationData);
      return educationData;
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
      const { data, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('employee_id', uid);

      if (error) throw error;
      
      const experienceData = data || [];
      setUserExperiences(experienceData);
      return experienceData;
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
      const [educationResult, experienceResult] = await Promise.all([
        supabase.from('schoolings').select('*').eq('employee_id', uid),
        supabase.from('experiences').select('*').eq('employee_id', uid)
      ]);
      
      if (educationResult.error) throw educationResult.error;
      if (experienceResult.error) throw experienceResult.error;
      
      const educationData = educationResult.data || [];
      const experienceData = experienceResult.data || [];
      
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