/**
 * HRIS API Module
 * 
 * This file re-exports all the HRIS-related API functions from various modules
 * to provide a unified entry point for HRIS data operations
 */

// Re-export profile-related API functions that are used in HRIS
export {
  fetchCurrentUserBasicInfo,
  fetchUserBasicInfo,
  updateBasicInfo,
  isCurrentUserProfile
} from '@/lib/api/profile/basicInfo';

export {
  fetchCurrentUserPersonalInfo,
  fetchUserPersonalInfo,
  updatePersonalInfo,
  getPersonalInfo
} from '@/lib/api/profile/personalInfo';

export {
  fetchUserEducation,
  fetchUserExperience,
  fetchUserEducationAndExperience
} from '@/lib/api/profile/educationExperience';

// Re-export company info functions
export { getCompanyInfo } from '@/lib/api/company/companyInfo';
export type { Company, Country, Industry } from '@/lib/api/company/companyInfo';

// Re-export education and experience related functions
export {
  getSchoolings,
  createSchooling,
  updateSchooling,
  deleteSchooling,
  uploadFile,
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience
} from '@/lib/api/education-and-experience'; 