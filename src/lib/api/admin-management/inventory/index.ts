import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId } from "@/lib/api/company/companyInfo";
import { requisitionInventorySchema, requisitionTypeSchema } from "@/lib/types";

export async function getRequisitionTypes() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("requisition_types")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createRequisitionType(
  payload: z.infer<typeof requisitionTypeSchema>
) {
  const company_id = await getCompanyId();

  const validated = requisitionTypeSchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("requisition_types").insert({
    payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function deleteRequisitionType(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("requisition_types")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}

export async function getRequisitionInventories() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("requisition_inventories")
    .select("*")
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function createRequisitionInventory(
  payload: z.infer<typeof requisitionInventorySchema>
) {
  const company_id = await getCompanyId();

  const validated = requisitionInventorySchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase.from("requisition_inventories").insert({
    ...payload,
    company_id,
  });

  if (error) throw error;
  return data;
}

export async function updateRequisitionInventory(
  payload: z.infer<typeof requisitionInventorySchema>
) {
  const company_id = await getCompanyId();

  const validated = requisitionInventorySchema.safeParse(payload);
  if (!validated.success) throw validated.error;

  const { data, error } = await supabase
    .from("requisition_inventories")
    .update(payload)
    .eq("id", payload.id)
    .eq("company_id", company_id);

  if (error) throw error;
  return data;
}

export async function deleteRequisitionInventory(id: number) {
  const company_id = await getCompanyId();

  const { error } = await supabase
    .from("requisition_inventories")
    .delete()
    .eq("id", id)
    .eq("company_id", company_id);

  if (error) throw error;
}

export async function getEmployeesInfo() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("company_id", company_id);

  const employees = data?.map((employee) => ({
    id: employee.id,
    name: `${employee.first_name} ${employee.last_name}`,
  }));

  if (error) throw error;
  return { data: employees, error: null };
}

export async function getExtendedEmployeesInfo() {
  const company_id = await getCompanyId();

  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, phone_number, department_id(name), designation, hire_date")
    .eq("company_id", company_id);

  const employees = data?.map((employee) => ({
    id: employee.id,
    name: `${employee.first_name} ${employee.last_name}`,
    email: employee.email,
    phone: employee.phone_number,
    department: (employee.department_id as unknown as { name: string }).name,
    designation: employee.designation,
    joinDate: employee.hire_date
  }));

  if (error) throw error;
  return { data: employees, error: null };
}
