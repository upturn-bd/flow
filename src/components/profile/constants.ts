import { BasicInfo, PersonalInfo } from "@/lib/types/schemas";

// Basic Info Types and Constants
export type BasicInfoFormData = BasicInfo;

export const JOB_STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Probation",
  "Resigned",
  "Terminated",
] as const;

// Personal Info Types and Constants
export type PersonalFormData = PersonalInfo;

export const Gender = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
} as const;

export const BloodGroup = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
} as const;

export const MaritalStatus = {
  MARRIED: "Married",
  UNMARRIED: "Unmarried",
  SINGLE: "Single",
} as const;
