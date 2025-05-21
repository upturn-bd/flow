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
  attachments: z.array(z.string()).optional(),
  id: z.number().optional(),
  employee_id: z.string().optional(),
  company_id: z.number().optional(),
});

export const leaveSchema = z.object({
  id: z.number().optional(),
  type_id: z.number().min(1, { message: "Please select a leave type" }),
  start_date: z.string().min(1, { message: "Please select a start date" }),
  end_date: z.string().min(1, { message: "Please select an end date" }),
  remarks: z
    .string()
    .max(250, { message: "Remarks must be 250 characters or fewer" })
    .optional(),
  status: z.string().min(1, { message: "Please select a status" }),
  approved_by_id: z.string().uuid().optional(),
  employee_id: z.string().optional(),
  requested_to: z.string().uuid().optional(),
  company_id: z.number().optional(),
  description: z.string().optional(),
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
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
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
  settlement_item: z
    .string()
    .min(1, { message: "Please enter a valid name" })
    .max(25),
  allowance: z.number().min(1, { message: "Please enter a valid allowance" }),
  settlement_level_id: z
    .number()
    .min(1, { message: "Please select a settlement level" }),
  settler_id: z.string().min(1, { message: "Please select a settler" }),
  company_id: z.number().optional(),
});

export const projectSchema = z.object({
  id: z.number().optional(),
  project_title: z
    .string({ message: "Please enter a valid project title" })
    .min(1, { message: "Please enter a valid project title" })
    .max(200),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Please select a start date" }),
  end_date: z.string().min(1, { message: "Please select an end date" }),
  project_lead_id: z
    .string()
    .min(1, { message: "Please select a project lead" }),
  remark: z.string().optional(),
  department_id: z.number().min(1, { message: "Please select a department" }),
  goal: z.string().optional(),
  progress: z.number().nullable().optional(),
  status: z.string(),
  company_id: z.number().optional(),
  assignees: z.array(z.string()).optional(),
});

export const milestoneSchema = z.object({
  id: z.number().optional(),
  milestone_title: z
    .string({ message: "Please enter a valid milestone title" })
    .min(1, { message: "Please enter a valid milestone title" })
    .max(200),
  description: z.string().optional(),
  start_date: z.string().min(1, { message: "Please select a start date" }),
  end_date: z.string().min(1, { message: "Please select an end date" }),
  status: z.string().min(1, { message: "Please select a status" }),
  weightage: z.number().min(1, { message: "Please enter a valid weightage" }),
  project_id: z.number().min(1, { message: "Please select a project" }),
  company_id: z.number().optional(),
  assignees: z.array(z.string()).optional(),
});

export const commentSchema = z.object({
  id: z.number().optional(),
  comment: z.string().min(1, { message: "Please enter a valid comment" }),
  commenter_id: z.string(),
  project_id: z.number(),
  company_id: z.number().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const taskSchema = z.object({
  id: z.number().optional(),
  task_title: z
    .string()
    .min(1, { message: "Please enter a valid task title" })
    .max(200),
  task_description: z.string().optional(),
  start_date: z.string().min(1, { message: "Please select a start date" }),
  end_date: z.string().min(1, { message: "Please select an end date" }),
  status: z.boolean().default(false),
  milestone_id: z.number().optional(),
  project_id: z.number().optional(),
  department_id: z.number().optional().nullable(),
  company_id: z.number().optional(),
  assignees: z.array(z.string()).optional(),
  priority: z.string().min(1, { message: "Please select a priority" }),
  created_by: z.string().optional().nullable(),
});

export const requisitionSchema = z.object({
  id: z.number().optional(),
  requisition_category_id: z
    .number()
    .min(1, { message: "Please select a category" }),
  employee_id: z.string().optional(),
  item_id: z.number().min(1, { message: "Please select an item" }),
  asset_owner: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(1, { message: "Please enter a valid quantity" }),
  approved_by_id: z.string().uuid().optional(),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  company_id: z.number().optional(),
  date: z.string().min(1, {
    message: "Please select a date",
  }),
  is_one_off: z.boolean().default(false),
  from_time: z.string().optional(),
  to_time: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  comment: z.string().optional(),
  remark: z.string().optional(),
});

export const settlementRecordSchema = z.object({
  id: z.number().optional(),
  settlement_type_id: z
    .number()
    .min(1, { message: "Please select a settlement type" }),
  description: z.string().optional(),
  event_date: z.string().min(1, { message: "Please select an event date" }),
  amount: z.number().min(0.01, { message: "Please enter a valid amount" }),
  comment: z.string().optional(),
  status: z.string().min(1, { message: "Please select a status" }),
  approved_by_id: z.string().optional(),
  claimant_id: z.string().optional(),
  requested_to: z.string().optional(),
  company_id: z.string().optional(),
  in_advance: z.boolean().optional(),
  attachments: z.array(z.string()).optional(),
});

export const complaintRecordSchema = z.object({
  id: z.number().optional(),
  complaint_type_id: z
    .number()
    .min(1, { message: "Please select a complaint type" }),
  complainer_id: z.string(),
  resolved_by_id: z.string().optional(),
  requested_to: z.string().optional(),
  description: z.string().min(1, { message: "Please enter a description" }),
  status: z.string().min(1, { message: "Please select a status" }),
  comment: z.string().optional(),
  company_id: z.number().optional(),
  anonymous: z.boolean().optional(),
  against_whom: z.string().min(1, { message: "Please select a person" }),
  attachments: z.array(z.string()).optional(),
});

export const noticeSchema = z.object({
  id: z.number().optional(),
  notice_type_id: z.number().min(1, { message: "Please select a notice type" }),
  title: z
    .string()
    .min(1, { message: "Please enter a title" })
    .max(200, { message: "Title must be 200 characters or fewer" }),
  description: z.string().min(1, { message: "Please enter a description" }),
  urgency: z.string().min(1, { message: "Please select an urgency level" }),
  valid_from: z.string().min(1, { message: "Please select a start date" }),
  valid_till: z.string().min(1, { message: "Please select an end date" }),
  company_id: z.number().optional(),
  department_id: z.number().optional(),
});

export const attendanceSchema = z.object({
  id: z.number().optional(),
  attendance_date: z
    .string()
    .min(1, { message: "Please select an attendance date" }),
  tag: z.string().min(1, { message: "Please select an attendance tag" }),
  company_id: z.number().optional(),
  site_id: z.number().min(1, { message: "Please select a site" }),
  check_in_time: z.string().optional(),
  check_in_coordinates: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  check_out_time: z.string().optional(),
  check_out_coordinates: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  supervisor_id: z.string().uuid().optional(),
  employee_id: z
    .string()
    .uuid()
    .min(1, { message: "Please select an employee" }),
});
