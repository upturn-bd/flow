// Global real-time notification manager
// Single WebSocket subscription per user for instant notifications

import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { Notification } from "@/lib/types/schemas";

type NotificationCallback = (notifications: Notification[], unreadCount: number) => void;

const NOTIFICATION_LIMIT = 20;

class NotificationManager {
  private channel: RealtimeChannel | null = null;
  private subscribers: Set<NotificationCallback> = new Set();
  private notifications: Notification[] = [];
  private unreadCount: number = 0;
  private userId: string | null = null;
  private companyId: number | null = null;

  subscribe(callback: NotificationCallback, userId: string, companyId: number) {
    this.subscribers.add(callback);
    
    // If user changed, reset and reconnect
    if (this.userId !== userId || this.companyId !== companyId) {
      this.userId = userId;
      this.companyId = companyId;
      this.notifications = [];
      this.unreadCount = 0;
      
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
      
      this.setupChannel();
    } else {
      // Same user, give them current state immediately
      callback(this.notifications, this.unreadCount);
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.cleanup();
      }
    };
  }

  private async setupChannel() {
    if (!this.userId || !this.companyId) return;

    console.log('[NotificationManager] Setting up realtime for user:', this.userId);

    // Fetch initial notifications (single query)
    await this.fetchNotifications();

    // Subscribe to realtime changes
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
        (payload) => {
          console.log('[NotificationManager] Realtime event:', payload.eventType);
          this.handleRealtimeEvent(payload);
        }
      )
      .subscribe((status) => {
        console.log('[NotificationManager] Channel status:', status);
      });
  }

  private async fetchNotifications() {
    if (!this.userId || !this.companyId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`*, type:notification_types(*)`)
        .eq('company_id', this.companyId)
        .eq('recipient_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(NOTIFICATION_LIMIT);

      if (error) throw error;

      this.notifications = data || [];
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      
      console.log('[NotificationManager] Loaded:', this.notifications.length, 'notifications,', this.unreadCount, 'unread');
      this.notifySubscribers();
    } catch (error) {
      console.error('[NotificationManager] Fetch error:', error);
    }
  }

  private handleRealtimeEvent(payload: any) {
    if (payload.eventType === 'INSERT') {
      const newNotification = payload.new as Notification;
      this.notifications = [newNotification, ...this.notifications].slice(0, NOTIFICATION_LIMIT);
      if (!newNotification.is_read) {
        this.unreadCount++;
      }
      this.notifySubscribers();
      
    } else if (payload.eventType === 'UPDATE') {
      const updated = payload.new as Notification;
      const old = this.notifications.find(n => n.id === updated.id);
      
      this.notifications = this.notifications.map(n =>
        n.id === updated.id ? { ...n, ...updated } : n
      );
      
      // Adjust unread count if is_read changed
      if (old && old.is_read !== updated.is_read) {
        this.unreadCount += updated.is_read ? -1 : 1;
        this.unreadCount = Math.max(0, this.unreadCount);
      }
      this.notifySubscribers();
      
    } else if (payload.eventType === 'DELETE') {
      const deleted = this.notifications.find(n => n.id === payload.old.id);
      this.notifications = this.notifications.filter(n => n.id !== payload.old.id);
      if (deleted && !deleted.is_read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifySubscribers();
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      callback(this.notifications, this.unreadCount);
    });
  }

  private cleanup() {
    console.log('[NotificationManager] Cleanup');
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.userId = null;
    this.companyId = null;
    this.notifications = [];
    this.unreadCount = 0;
  }

  // Optimistic local updates (UI updates instantly, realtime syncs from DB)
  markAsReadLocally(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
      this.notifications = this.notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifySubscribers();
    }
  }

  markAllAsReadLocally() {
    this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
    this.unreadCount = 0;
    this.notifySubscribers();
  }

  removeLocally(notificationId: number) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      if (!notification.is_read) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifySubscribers();
    }
  }

  // Force refresh (for error recovery)
  async refetchAll() {
    await this.fetchNotifications();
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
