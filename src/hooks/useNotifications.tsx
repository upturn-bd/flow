"use client";

import { useBaseEntity } from "./core";
import { Notification, NotificationType } from "@/lib/types/schemas";
import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { getCompanyId, getUserId } from "@/lib/utils/auth";

export type { Notification, NotificationType };

// Hook for notification types
export function useNotificationTypes() {
  const baseResult = useBaseEntity<NotificationType>({
    tableName: "notification_types",
    entityName: "notification type",
    companyScoped: true,
  });
  
  return {
    ...baseResult,
    notificationTypes: baseResult.items,
    notificationType: baseResult.item,
    fetchNotificationTypes: baseResult.fetchItems,
    fetchNotificationType: baseResult.fetchItem,
    createNotificationType: baseResult.createItem,
    updateNotificationType: baseResult.updateItem,
    deleteNotificationType: baseResult.deleteItem,
  };
}

// Hook for notifications with enhanced functionality
export function useNotifications() {
  const baseResult = useBaseEntity<Notification>({
    tableName: "notifications",
    entityName: "notification",
    companyScoped: true,
    userScoped: true, // Notifications are user-specific
  });

  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch notifications for current user with type information
  const fetchUserNotifications = useCallback(async (limit = 20) => {
    try {
      const company_id = await getCompanyId();
      const user_id = await getUserId();

      if (!company_id || !user_id) {
        console.error('Company ID or User ID not found');
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          type:notification_types(*)
        `)
        .eq('company_id', company_id)
        .eq('recipient_id', user_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const company_id = await getCompanyId();
      const user_id = await getUserId();

      if (!company_id || !user_id) {
        setUnreadCount(0);
        return 0;
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company_id)
        .eq('recipient_id', user_id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      const unreadCount = count || 0;
      setUnreadCount(unreadCount);
      return unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
      return 0;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: number) => {
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

      // Update unread count
      await fetchUnreadCount();
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [fetchUnreadCount]);

  // Mark all notifications as read for current user
  const markAllAsRead = useCallback(async () => {
    try {
      const company_id = await getCompanyId();
      const user_id = await getUserId();

      if (!company_id || !user_id) {
        return { success: false, error: 'Company ID or User ID not found' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('company_id', company_id)
        .eq('recipient_id', user_id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      setUnreadCount(0);
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Create notification (for system use)
  const createNotification = useCallback(async (notificationData: Partial<Notification>) => {
    try {
      const company_id = await getCompanyId();
      
      if (!company_id) {
        return { success: false, error: 'Company ID not found' };
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          company_id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      // Update unread count
      await fetchUnreadCount();
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [fetchUnreadCount]);

  // Memoized result
  return useMemo(() => ({
    ...baseResult,
    notifications: baseResult.items,
    notification: baseResult.item,
    unreadCount,
    
    // Enhanced functions
    fetchUserNotifications,
    fetchUnreadCount,
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
    unreadCount,
    fetchUserNotifications,
    fetchUnreadCount,
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
  options: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    context?: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
    referenceId?: number;
    referenceTable?: string;
  } = {}
) => {
  const company_id = await getCompanyId();
  
  if (!company_id) {
    return { success: false, error: 'Company ID not found' };
  }

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        recipient_id: recipientId,
        company_id,
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

    return { success: true, data };
  } catch (error) {
    console.error('Error creating system notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};