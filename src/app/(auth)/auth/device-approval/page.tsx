'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { getDeviceId } from '@/lib/utils/device';
import { ShieldCheck, Clock, SignOut } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

export default function DeviceApprovalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    // Initial check
    checkStatus(id);

    // Subscribe to changes
    const channel = supabase
      .channel('device_status_change')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_devices',
          filter: `device_id=eq.${id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setStatus(newStatus);
          if (newStatus === 'approved') {
            // Auto redirect
            setTimeout(() => {
                window.location.href = '/home';
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function checkStatus(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        router.push('/login');
        return;
    }

    const { data } = await supabase
      .from('user_devices')
      .select('status')
      .eq('user_id', user.id)
      .eq('device_id', id)
      .single();

    if (data) {
      setStatus(data.status);
      if (data.status === 'approved') {
        router.push('/home');
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-secondary p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-primary p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-border-primary"
      >
        <div className="flex justify-center mb-6">
          <div className={`p-4 rounded-full ${status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
            {status === 'rejected' ? (
                <ShieldCheck size={48} weight="duotone" />
            ) : (
                <Clock size={48} weight="duotone" />
            )}
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground-primary mb-2">
          {status === 'rejected' ? 'Device Rejected' : 'Awaiting Approval'}
        </h1>
        
        <p className="text-foreground-secondary mb-8">
          {status === 'rejected' 
            ? "This device has been rejected by your administrator. You cannot access the application from this device."
            : "This is a new device. For security reasons, your supervisor must approve this device before you can access the application."
          }
        </p>

        {status === 'pending' && (
          <div className="bg-surface-secondary p-4 rounded-lg mb-8 text-sm text-foreground-secondary animate-pulse">
            Waiting for approval...
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-border-primary rounded-lg text-foreground-primary hover:bg-surface-hover transition-colors font-medium"
        >
          <SignOut size={20} />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
