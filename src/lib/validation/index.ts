// Main validation export
export * from './schemas/common';
export * from './schemas/entities';
export * from './schemas/advanced';
export * from './notifications';

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
  validateLineageForm,
  validateNotice,
  type EducationData,
  type ExperienceData,
  type ProjectData,
  type MilestoneData,
  type TaskData,
  type ClaimTypeData,
  type LineageData,
  type LineageFormData,
  type NoticeData
} from './schemas/advanced';
