import { z } from "zod";

export const schoolingTypes = [
  "High School",
  "College",
  "Diploma",
  "Bachelors",
  "Masters",
  "PGD",
  "PhD",
  "Post-Doc",
] as const;

export const schoolingSchema = z.object({
  type: z.enum(schoolingTypes),
  name: z.string().min(1).max(50),
  institute: z.string().min(1).max(100),
  from_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid from_date",
  }),
  to_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid to_date",
  }),
  result: z.string().min(1).max(15),
  file_path: z.string().optional(),
  id: z.number().optional(),
  employee_id: z.string().optional(),
  company_id: z.number().optional(),
});

export const experienceSchema = z.object({
  company_name: z.string().min(1).max(50),
  designation: z.string().min(1).max(25),
  from_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid from_date",
  }),
  to_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid to_date",
  }),
  description: z.string().optional(),
  employee_id: z.string().optional(),
  company_id: z.number().optional(),
  id: z.number().optional(),
});

export const lineageSchema = z.object({
  name: z.string().min(1).max(50),
  hierarchical_level: z
    .number()
    .int()
    .min(1, { message: "hierarchical_level must be a positive integer" }),
  position_id: z.number({ required_error: "position_id is required" }),
  company_id: z.number().optional(),
  id: z.number().optional(),
});

export const siteSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(100),
  longitude: z.number().min(1),
  latitude: z.number().min(1),
  check_in: z.string().min(1),
  check_out: z.string().min(1),
  location: z.string().min(1),
  company_id: z.number().optional(),
});

export const leaveTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(30),
  annual_quota: z.number().min(1),
  company_id: z.number().optional(),
});

export const holidayConfigSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  start_day: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid from_date",
  }),
  end_day: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid from_date",
  }),
  company_id: z.number().optional(),
});

export const requisitionTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: "Please enter a valid name" }).max(50),
  company_id: z.number().optional(),
});

export const newsAndNoticeTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  company_id: z.number().optional(),
});

export const complaintsTypeSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1).max(50),
  company_id: z.number().optional(),
});

export const requisitionInventorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: "Please enter a valid name" }).max(50),
  requisition_category_id: z
    .number()
    .min(1, { message: "Please select a category" }),
  description: z.string().optional(),
  asset_owner: z.string().min(1, { message: "Please select an asset owner" }),
  quantity: z.number().min(1),
  company_id: z.number().optional(),
  department_id: z.number().min(1, { message: "Please select a department" }),
});

export const claimTypeSchema = z.object({
  id: z.number().optional(),
  claim_item: z
    .string()
    .min(1, { message: "Please enter a valid name" })
    .max(25),
  allowance: z.number().min(1, { message: "Please enter a valid allowance" }),
  claim_level_id: z.number().min(1, { message: "Please select a claim level" }),
  settler_id: z.string().min(1, { message: "Please select a settler" }),
  company_id: z.number().optional(),
});
