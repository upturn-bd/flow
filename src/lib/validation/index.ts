// Main validation export
export * from './schemas/common';
export * from './schemas/entities';
export * from './schemas/advanced';

// Legacy compatibility - re-export ValidationResult with generic parameter
export type { ValidationResult } from './schemas/common';

// Convenience exports for commonly used validations
export { 
  validateEducation, 
  validateExperience, 
  validateProject, 
  validateMilestone, 
  validateTask, 
  validateClaimType, 
  validateLineage,
  validateNotice,
  type EducationData,
  type ExperienceData,
  type ProjectData,
  type MilestoneData,
  type TaskData,
  type ClaimTypeData,
  type LineageData,
  type NoticeData
} from './schemas/advanced';
