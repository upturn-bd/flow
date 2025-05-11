import * as z from "zod";

export const personalInfoSchema = z.object({
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  religion: z.string().optional(),
  blood_group: z.string().optional(),
  marital_status: z.string().optional(),
  nid_no: z.string().optional(),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  spouse_name: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_relation: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  permanent_address: z.string().optional(),
});

export type PersonalFormData = z.infer<typeof personalInfoSchema>;

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