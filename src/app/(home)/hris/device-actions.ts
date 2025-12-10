"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateDeviceStatus(deviceId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient();
  
  // TODO: Add robust permission check here (e.g. check if user is admin/manager)
  
  const { error } = await supabase
    .from('user_devices')
    .update({ status })
    .eq('id', deviceId);
    
  if (error) return { error: error.message };
  
  revalidatePath('/hris');
  return { success: true };
}

export async function deleteDevice(deviceId: string) {
  const supabase = await createClient();
  
  // TODO: Add robust permission check here
  
  const { error } = await supabase
    .from('user_devices')
    .delete()
    .eq('id', deviceId);
    
  if (error) return { error: error.message };
  
  revalidatePath('/hris');
  return { success: true };
}
