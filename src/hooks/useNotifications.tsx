"use client";

import { useBaseEntity } from "./core";
import { Notification, NotificationType } from "@/lib/types/schemas";
import { useState, useCallback, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { captureSupabaseError, captureApiError } from "@/lib/sentry";
import { notificationManager } from "@/lib/realtime/notificationManager";

export type { Notification, NotificationType };

// Hook for notifications with enhanced functionality
export function useNotifications() {
  const { employeeInfo } = useAuth();
  const baseResult = useBaseEntity<Notification>({
    tableName: "notifications",
    entityName: "notification",
    companyScoped: true,
    userScoped: true, // Notifications are user-specific
  });

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Subscribe to the global notification manager
  useEffect(() => {
    const companyId = employeeInfo?.company_id;
    const userId = employeeInfo?.id;

    if (!companyId || !userId) {
      console.log('Skipping notification subscription - missing companyId or userId');
      return;
    }

    console.log('[useNotifications] Subscribing to notification manager');

    // Subscribe to the singleton manager
    const unsubscribe = notificationManager.subscribe(
      (newNotifications, newUnreadCount) => {
        console.log('[useNotifications] Received update:', newNotifications.length, 'notifications,', newUnreadCount, 'unread');
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
      },
      userId,
      typeof companyId === 'number' ? companyId : parseInt(companyId)
    );

    // Cleanup on unmount
    return () => {
      console.log('[useNotifications] Unsubscribing from notification manager');
      unsubscribe();
    };
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // Fetch notifications for current user with type information
  const fetchUserNotifications = useCallback(async (limit = 20) => {
    // This is handled by the manager, but kept for compatibility
    return notifications.slice(0, limit);
  }, [notifications]);

  // Mark notification as read (optimistic update + database)
  const markAsRead = useCallback(async (notificationId: number) => {
    // Optimistic update - immediate UI feedback
    notificationManager.markAsReadLocally(notificationId);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      // Revert on error by refetching
      await notificationManager.refetchAll();
      captureSupabaseError(
        { message: error instanceof Error ? error.message : String(error) },
        "markAsRead",
        { notificationId }
      );
      console.error('Error marking notification as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Mark all notifications as read for current user (optimistic update + database)
  const markAllAsRead = useCallback(async () => {
    // Optimistic update - immediate UI feedback
    notificationManager.markAllAsReadLocally();
    
    try {
      const companyId = employeeInfo?.company_id;
      const userId = employeeInfo?.id;

      if (!companyId || !userId) {
        return { success: false, error: 'Company ID or User ID not found' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('company_id', companyId)
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      // Revert on error by refetching
      await notificationManager.refetchAll();
      captureSupabaseError(
        { message: error instanceof Error ? error.message : String(error) },
        "markAllAsRead",
        { companyId: employeeInfo?.company_id, userId: employeeInfo?.id }
      );
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [employeeInfo?.company_id, employeeInfo?.id]);

  // Create notification (for system use)
  const createNotification = useCallback(async (notificationData: Partial<Notification>) => {
    const companyId = employeeInfo?.company_id;
    try {
      if (!companyId) {
        return { success: false, error: 'Company ID not found' };
      }


      const res = await fetch(`https://hprpwdtlwqtzodygssdc.supabase.co/functions/v1/create_notification`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
         },
        body: JSON.stringify({ notificationData }),
      });

      if (!res.ok) {
        captureApiError(res, "POST /functions/v1/create_notification", { companyId });
        return { success: false, error: `HTTP error: ${res.status}` };
      }

      return await res.json(); // waits for server 


    } catch (error) {
      captureApiError(
        error,
        "POST /functions/v1/create_notification",
        { companyId }
      );
      console.error('Error creating notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [employeeInfo?.company_id]);

  // Delete notification (optimistic update + database)
  const deleteNotification = useCallback(async (notificationId: number) => {
    // Optimistic update - immediate UI feedback
    notificationManager.removeLocally(notificationId);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      // Revert on error by refetching
      await notificationManager.refetchAll();
      captureSupabaseError(
        { message: error instanceof Error ? error.message : String(error) },
        "deleteNotification",
        { notificationId }
      );
      console.error('Error deleting notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Memoized result
  return useMemo(() => ({
    ...baseResult,
    notifications: notifications, // Use real-time notifications state
    notification: baseResult.item,
    unreadCount,

    // Enhanced functions
    fetchUserNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,

    // Base functions
    fetchNotifications: baseResult.fetchItems,
    fetchNotification: baseResult.fetchItem,
    updateNotification: baseResult.updateItem,
  }), [
    baseResult,
    notifications,
    unreadCount,
    fetchUserNotifications,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
  ]);
}

// Utility function to create common notification types
export const createSystemNotification = async (
  recipientId: string,
  title: string,
  message: string,
  companyId: number,
  options: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    context?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    referenceId?: number;
    referenceTable?: string;
  } = {}
) => {
  if (!companyId) {
    return { success: false, error: 'Company ID not found' };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        recipient_id: recipientId,
        company_id: companyId,
        priority: options.priority || 'normal',
        context: options.context,
        action_url: options.actionUrl,
        metadata: options.metadata,
        reference_id: options.referenceId,
        reference_table: options.referenceTable,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send email for high priority notifications
    const priority = options.priority || 'normal';
    if (priority === 'high' || priority === 'urgent') {
      // Import server action for email sending (ensures server-side execution)
      const { sendNotificationEmailAction } = await import('@/lib/actions/email-actions');
      
      // Fetch recipient email from employees table
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('email, first_name, last_name')
        .eq('id', recipientId)
        .single();

      if (employeeError) {
        console.error('Failed to fetch employee for notification email:', employeeError);
      } else if (employee?.email) {
        const recipientName = `${employee.first_name} ${employee.last_name}`.trim();
        // Send email asynchronously without blocking the notification creation
        // Using server action ensures email is sent from server where API key is available
        sendNotificationEmailAction({
          recipientEmail: employee.email,
          recipientName,
          title,
          message,
          priority: priority as 'high' | 'urgent',
          actionUrl: options.actionUrl,
          context: options.context,
        }).catch((emailError) => {
          // Log email error but don't fail the notification
          console.error('Failed to send notification email:', emailError);
        });
      }
    }

    return { success: true, data };
  } catch (error) {
    captureSupabaseError(
      { message: error instanceof Error ? error.message : String(error) },
      "createSystemNotification",
      { recipientId, companyId, title }
    );
    console.error('Error creating system notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};