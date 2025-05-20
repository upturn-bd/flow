/**
 * Profile API functions
 * 
 * This module provides API functions for accessing and updating user profile data
 * including basic information, personal information, education and work experience.
 */

// Basic Info API
export {
  fetchCurrentUserBasicInfo,
  fetchUserBasicInfo,
  updateBasicInfo
} from './basicInfo';

// Personal Info API  
export {
  fetchCurrentUserPersonalInfo,
  fetchUserPersonalInfo,
  updatePersonalInfo
} from './personalInfo';

// Education & Experience API
export {
  fetchUserEducation,
  fetchUserExperience,
  fetchUserEducationAndExperience
} from './educationExperience';

// Common utilities
export { isCurrentUserProfile } from './basicInfo'; 