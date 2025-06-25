import { BasicInfo } from "@/lib/types/schemas";

export type BasicInfoFormData = BasicInfo;

export const JOB_STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Probation",
  "Resigned",
  "Terminated",
] as const; 