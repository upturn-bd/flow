import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { updateDeviceStatus as updateStatusAction, deleteDevice as deleteDeviceAction } from '@/app/(home)/hris/device-actions';

export interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_info: string;
  status: 'approved' | 'pending' | 'rejected';
  last_login: string;
  created_at: string;
  ip_address?: string;
  location?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  model?: string;
}

export function useUserDevices(userId: string | null) {
  const [devices, setDevices] = useState<UserDevice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .order('last_login', { ascending: false });
      
    if (!error && data) {
      setDevices(data as UserDevice[]);
    }
    setLoading(false);
  };

  const updateDeviceStatus = async (deviceId: string, status: 'approved' | 'rejected') => {
    const result = await updateStatusAction(deviceId, status);
    if (result.success) {
      fetchDevices();
    }
    return result;
  };

  const deleteDevice = async (deviceId: string) => {
    const result = await deleteDeviceAction(deviceId);
    if (result.success) {
      fetchDevices();
    }
    return result;
  };

  useEffect(() => {
    fetchDevices();
  }, [userId]);

  return { devices, loading, updateDeviceStatus, deleteDevice, refresh: fetchDevices };
}
