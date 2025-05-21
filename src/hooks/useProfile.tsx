"use client";

import { useState, useCallback } from "react";
// Basic Info APIs
import { 
  fetchCurrentUserBasicInfo as fetchCurrentUserBasicInfoApi, 
  fetchUserBasicInfo as fetchUserBasicInfoApi, 
  updateBasicInfo as updateBasicInfoApi,
  isCurrentUserProfile as isCurrentUserProfileApi
} from "@/lib/api/profile/basicInfo";

// Personal Info APIs
import { 
  fetchCurrentUserPersonalInfo as fetchCurrentUserPersonalInfoApi, 
  fetchUserPersonalInfo as fetchUserPersonalInfoApi, 
  updatePersonalInfo as updatePersonalInfoApi
} from "@/lib/api/profile/personalInfo";

// Education & Experience APIs
import { 
  fetchUserEducation as fetchUserEducationApi, 
  fetchUserExperience as fetchUserExperienceApi 
} from "@/lib/api/profile/educationExperience";

// Types
import { BasicInfoFormData } from "@/app/(home)/hris/tabs/basicInfo.constants";
import { PersonalFormData } from "@/app/(home)/hris/tabs/personalInfo.constants";
import { Education } from "@/hooks/useEducation";
import { Experience } from "@/hooks/useExperience";

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
      const result = await fetchCurrentUserBasicInfoApi();
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
      const result = await fetchUserBasicInfoApi(uid);
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
      const result = await updateBasicInfoApi(data);
      setBasicInfo(result.data);
      return result;
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
      const result = await fetchCurrentUserPersonalInfoApi();
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
      const result = await fetchUserPersonalInfoApi(uid);
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
      const result = await updatePersonalInfoApi(data);
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
      const data = await fetchUserEducationApi(uid);
      setEducations(data);
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
      setExperiences(data);
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

  // Comprehensive user data fetch
  const fetchUserProfile = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      // Check if this is the current user's profile
      const isCurrentUserResult = await isCurrentUserProfileApi(uid);
      setIsCurrentUser(isCurrentUserResult);
      
      // Fetch all user data in parallel
      const [basicInfoData, personalInfoData, educationData, experienceData] = await Promise.all([
        isCurrentUserResult ? fetchCurrentUserBasicInfoApi() : fetchUserBasicInfoApi(uid),
        isCurrentUserResult ? fetchCurrentUserPersonalInfoApi() : fetchUserPersonalInfoApi(uid),
        fetchUserEducationApi(uid),
        fetchUserExperienceApi(uid)
      ]);
      
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
    
    // Comprehensive fetch method
    fetchUserProfile
  };
} 