/**
 * Type definitions for notice-related objects
 * These replace the Zod schemas
 */

export interface Notice {
  id?: number;
  notice_type_id: number;
  title: string;
  description: string;
  urgency: string;
  valid_from: string;
  valid_till: string;
  company_id?: number;
  department_id?: number;
}
