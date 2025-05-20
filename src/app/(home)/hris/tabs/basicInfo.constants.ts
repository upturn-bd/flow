import { z } from "zod";

export const basicInfoSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(1, "Phone number is required"),
  department_id: z.number().min(0, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  job_status: z.string().min(1, "Job status is required"),
  hire_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  id_input: z.string().min(1, "ID is required"),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

export const JOB_STATUS_OPTIONS = [
  "Active",
  "Inactive",
  "Probation",
  "Resigned",
  "Terminated",
] as const; 