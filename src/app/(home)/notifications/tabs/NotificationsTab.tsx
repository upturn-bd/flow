"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Clock,
  WarningCircle,
  Calendar,
  Briefcase,
  User,
  Trash,
  Check,
  ExternalLink
} from "@/lib/icons";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

const iconMap = {
  'alert-circle': WarningCircle,
  'calendar': Calendar,
  'briefcase': Briefcase,
  'user': User,
  'clock': Clock,
  'bell': Bell,
};

const colorMap = {
  'red': 'text-red-500',
  'blue': 'text-blue-500',
  'green': 'text-green-500',
  'purple': 'text-purple-500',
  'orange': 'text-orange-500',
  'gray': 'text-foreground-tertiary',
};

const priorityStyles = {
  'urgent': 'border-l-red-500 bg-red-50 dark:bg-red-900/30',
  'high': 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/30',
  'normal': 'border-l-primary-500 bg-surface-primary',
  'low': 'border-l-border-secondary bg-background-secondary dark:bg-background-tertiary',
};

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    fetchUserNotifications,
    markAsRead,
    deleteNotification,
    markAllAsRead
  } = useNotifications();
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserNotifications(50); // Load more for the full page
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUserNotifications]);
  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);



  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      )
    );
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
    );
  };

  const handleDeleteNotification = async (notificationId: number) => {
    await deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-foreground-secondary" />
          <h2 className="text-lg font-semibold text-foreground-primary">All Notifications</h2>
          {unreadNotifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unreadNotifications.length} unread
            </span>
          )}
        </div>

        {unreadNotifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 text-foreground-tertiary">
          <Bell className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
          <h3 className="text-lg font-medium text-foreground-primary mb-2">No notifications</h3>
          <p>You&apos;re all caught up! New notifications will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const IconComponent = iconMap[notification.type?.icon as keyof typeof iconMap] || Bell;
  const iconColor = colorMap[notification.type?.color as keyof typeof colorMap] || 'text-foreground-tertiary';
  const priorityStyle = priorityStyles[notification.priority as keyof typeof priorityStyles] || priorityStyles.normal;

  return (
    <div className={`border-l-4 rounded-lg p-4 ${priorityStyle} ${!notification.is_read ? 'shadow-sm' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`flex-shrink-0 ${iconColor} mt-0.5`}>
            <IconComponent className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium truncate ${!notification.is_read ? 'text-foreground-primary' : 'text-foreground-secondary'}`}>
                {notification.title}
              </h4>
              {!notification.is_read && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
              )}
            </div>

            <p className={`text-sm mb-2 ${!notification.is_read ? 'text-foreground-secondary' : 'text-foreground-secondary'}`}>
              {notification.message}
            </p>

            <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(notification.created_at || '')}
              </span>
              {notification.context && (
                <span className="px-2 py-0.5 bg-background-tertiary dark:bg-surface-secondary rounded text-foreground-secondary">
                  {notification.context.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {notification.action_url && (
            <Link
              href={notification.action_url}
              className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"
              title="View details"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          )}

          {!notification.is_read && (
            <button
              onClick={() => onMarkAsRead(notification.id!)}
              className="text-green-600 hover:bg-green-50 p-1.5 rounded"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => onDelete(notification.id!)}
            className="text-red-600 hover:bg-red-50 p-1.5 rounded"
            title="Delete notification"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}