// Global real-time notification manager
// This ensures only ONE subscription exists across the entire app

import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Notification } from "@/lib/types/schemas";

type NotificationCallback = (notifications: Notification[], unreadCount: number) => void;

class NotificationManager {
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<NotificationCallback> = new Set();
  private notifications: Notification[] = [];
  private unreadCount: number = 0;
  private userId: string | null = null;
  private companyId: number | null = null;

  subscribe(callback: NotificationCallback, userId: string, companyId: number) {
    this.subscribers.add(callback);
    
    // If this is the first subscriber or user changed, set up the channel
    if (!this.channel || this.userId !== userId || this.companyId !== companyId) {
      this.userId = userId;
      this.companyId = companyId;
      this.setupChannel();
    } else {
      // Immediately notify new subscriber with current state
      callback(this.notifications, this.unreadCount);
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      
      // If no more subscribers, clean up the channel
      if (this.subscribers.size === 0) {
        this.cleanup();
      }
    };
  }

  private async setupChannel() {
    if (!this.userId || !this.companyId) return;

    // Clean up existing channel
    if (this.channel) {
      await supabase.removeChannel(this.channel);
    }

    console.log('[NotificationManager] Setting up channel for user:', this.userId);

    // Fetch initial data
    await this.fetchNotifications();

    // Set up real-time subscription
    const channelName = `notifications:${this.userId}:${this.companyId}`;
    
    this.channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${this.userId}`,
        },
        async (payload) => {
          console.log('[NotificationManager] Real-time event:', payload.eventType);
          await this.handleRealtimeEvent(payload);
        }
      )
      .subscribe((status) => {
        console.log('[NotificationManager] Subscription status:', status);
      });
  }

  private async fetchNotifications() {
    if (!this.userId || !this.companyId) return;

    try {
      const { data: notificationData } = await supabase
        .from('notifications')
        .select(`*, type:notification_types(*)`)
        .eq('company_id', this.companyId)
        .eq('recipient_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(20);

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', this.companyId)
        .eq('recipient_id', this.userId)
        .eq('is_read', false);

      this.notifications = notificationData || [];
      this.unreadCount = count || 0;
      
      console.log('[NotificationManager] Fetched:', this.notifications.length, 'notifications,', this.unreadCount, 'unread');
      
      this.notifySubscribers();
    } catch (error) {
      console.error('[NotificationManager] Fetch error:', error);
    }
  }

  private async handleRealtimeEvent(payload: any) {
    if (payload.eventType === 'INSERT') {
      const newNotification = payload.new;
      
      // Fetch with type information
      const { data } = await supabase
        .from('notifications')
        .select(`*, type:notification_types(*)`)
        .eq('id', newNotification.id)
        .single();

      if (data) {
        this.notifications = [data, ...this.notifications];
        if (!data.is_read) {
          this.unreadCount++;
        }
        this.notifySubscribers();
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedNotification = payload.new;
      this.notifications = this.notifications.map(n =>
        n.id === updatedNotification.id ? { ...n, ...updatedNotification } : n
      );
      await this.fetchNotifications(); // Refresh unread count
    } else if (payload.eventType === 'DELETE') {
      this.notifications = this.notifications.filter(n => n.id !== payload.old.id);
      await this.fetchNotifications(); // Refresh unread count
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback(this.notifications, this.unreadCount);
    });
  }

  private cleanup() {
    console.log('[NotificationManager] Cleaning up channel');
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.userId = null;
    this.companyId = null;
  }

  async refetchUnreadCount() {
    if (!this.userId || !this.companyId) return 0;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .eq('recipient_id', this.userId)
      .eq('is_read', false);

    this.unreadCount = count || 0;
    this.notifySubscribers();
    return this.unreadCount;
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
