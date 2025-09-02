"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getEmployeeInfo, getUserId } from "@/lib/utils/auth";

// Types
import { BasicInfoFormData } from "@/app/(home)/hris/tabs/basicInfo.constants";
import { PersonalFormData } from "@/app/(home)/hris/tabs/personalInfo.constants";
import { Schooling, Experience } from "@/lib/types";

// Type aliases for consistency
export type Education = Schooling;

// Comprehensive profile hook that combines basic info, personal info, and education/experience
export function useProfile() {
  // State for basic info
  const [basicInfo, setBasicInfo] = useState<BasicInfoFormData | null>(null);
  
  // State for personal info
  const [personalInfo, setPersonalInfo] = useState<PersonalFormData | null>(null);
  
  // State for education and experience
  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  
  // Shared states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(true);

  // Basic Info methods
  const fetchCurrentUserBasicInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const employeeInfo = await getEmployeeInfo();
      
      const { data: result, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeInfo.id)
        .single();

      if (error) throw error;
      
      setBasicInfo(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch basic info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserBasicInfo = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;
      
      setBasicInfo(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user's basic info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBasicInfo = useCallback(async (data: BasicInfoFormData) => {
    setLoading(true);
    setError(null);
    try {
      const employeeInfo = await getEmployeeInfo();
      
      const { data: result, error } = await supabase
        .from('employees')
        .update(data)
        .eq('id', employeeInfo.id)
        .select()
        .single();

      if (error) throw error;
      
      setBasicInfo(result);
      return { data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update basic info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Personal Info methods
  const fetchCurrentUserPersonalInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const employeeInfo = await getEmployeeInfo();
      
      const { data: result, error } = await supabase
        .from('personal_infos')
        .select('*')
        .eq('id', employeeInfo.id)
        .single();

      if (error) throw error;
      
      setPersonalInfo(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch personal info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPersonalInfo = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error } = await supabase
        .from('personal_infos')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;
      
      setPersonalInfo(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user's personal info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePersonalInfo = useCallback(async (data: PersonalFormData) => {
    setLoading(true);
    setError(null);
    try {
      const employeeInfo = await getEmployeeInfo();
      
      const { data: result, error } = await supabase
        .from('personal_infos')
        .update(data)
        .eq('id', employeeInfo.id)
        .select()
        .single();

      if (error) throw error;
      
      setPersonalInfo(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update personal info";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Education and Experience methods
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
      setEducations(educationData);
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
      setExperiences(experienceData);
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

  // Education CRUD operations
  const createEducation = useCallback(async (educationData: Omit<Education, "id">) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('schoolings')
        .insert([educationData])
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setEducations(prev => [...prev, data]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create education";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEducation = useCallback(async (id: number, educationData: Partial<Education>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('schoolings')
        .update(educationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setEducations(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update education";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEducation = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('schoolings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setEducations(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete education";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Experience CRUD operations
  const createExperience = useCallback(async (experienceData: Omit<Experience, "id">) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .insert([experienceData])
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setExperiences(prev => [...prev, data]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create experience";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExperience = useCallback(async (id: number, experienceData: Partial<Experience>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('experiences')
        .update(experienceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setExperiences(prev => prev.map(item => item.id === id ? data : item));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update experience";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteExperience = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      setExperiences(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete experience";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch current user's education and experience
  const fetchCurrentUserEducation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      return await fetchUserEducation(user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch current user education";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserEducation]);

  const fetchCurrentUserExperience = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      return await fetchUserExperience(user.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch current user experience";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUserExperience]);

  // Comprehensive user data fetch
  const fetchUserProfile = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      // Check if this is the current user's profile
      const currentUserId = await getUserId();
      const isCurrentUserResult = currentUserId === uid;
      setIsCurrentUser(isCurrentUserResult);
      
      // Fetch all user data in parallel
      const [basicInfoResult, personalInfoResult, educationResult, experienceResult] = await Promise.all([
        supabase.from('employees').select('*').eq('id', uid).single(),
        supabase.from('personal_infos').select('*').eq('id', uid).single(),
        supabase.from('schoolings').select('*').eq('employee_id', uid),
        supabase.from('experiences').select('*').eq('employee_id', uid)
      ]);
      
      // Handle any errors
      if (basicInfoResult.error) throw basicInfoResult.error;
      if (personalInfoResult.error) throw personalInfoResult.error;
      if (educationResult.error) throw educationResult.error;
      if (experienceResult.error) throw experienceResult.error;
      
      const basicInfoData = basicInfoResult.data;
      const personalInfoData = personalInfoResult.data;
      const educationData = educationResult.data || [];
      const experienceData = experienceResult.data || [];
      
      // Update all states
      setBasicInfo(basicInfoData);
      setPersonalInfo(personalInfoData);
      setEducations(educationData);
      setExperiences(experienceData);
      
      return {
        basicInfo: basicInfoData,
        personalInfo: personalInfoData,
        educations: educationData,
        experiences: experienceData,
        isCurrentUser: isCurrentUserResult
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user profile";
      setError(errorMessage);
      console.error(errorMessage, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // States
    basicInfo,
    personalInfo,
    educations,
    experiences,
    loading,
    error,
    isCurrentUser,
    
    // Basic Info methods
    fetchCurrentUserBasicInfo,
    fetchUserBasicInfo,
    updateBasicInfo,
    
    // Personal Info methods
    fetchCurrentUserPersonalInfo,
    fetchUserPersonalInfo,
    updatePersonalInfo,
    
    // Education and Experience methods
    fetchUserEducation,
    fetchUserExperience,
    fetchCurrentUserEducation,
    fetchCurrentUserExperience,
    
    // Education CRUD operations
    createEducation,
    updateEducation,
    deleteEducation,
    
    // Experience CRUD operations
    createExperience,
    updateExperience,
    deleteExperience,
    
    // Comprehensive fetch method
    fetchUserProfile
  };
} 