"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  AlertCircle, 
  Calendar,
  Briefcase,
  User,
  Trash2,
  CheckCheck,
  ExternalLink
} from "lucide-react";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import { Z_INDEX } from "@/lib/theme";
import Portal from "@/components/ui/Portal";
import Link from "next/link";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const iconMap = {
  'alert-circle': AlertCircle,
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
  'gray': 'text-gray-500',
};

const priorityColors = {
  'urgent': 'border-l-red-500 bg-red-50',
  'high': 'border-l-orange-500 bg-orange-50',
  'normal': 'border-l-blue-500 bg-white',
  'low': 'border-l-gray-500 bg-gray-50',
};

export default function NotificationDropdown({ 
  isOpen, 
  onClose, 
  triggerRef 
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  
  const { 
    fetchUserNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchUnreadCount 
  } = useNotifications();

  // Calculate position relative to trigger
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      setPosition({
        top: triggerRect.bottom + scrollTop + 8, // 8px gap
        right: window.innerWidth - triggerRect.right - scrollLeft,
      });
    }
  }, [isOpen, triggerRef]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await fetchUserNotifications(20);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

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
      prev.map(n => ({ 
        ...n, 
        is_read: true, 
        read_at: new Date().toISOString() 
      }))
    );
  };

  const handleDeleteNotification = async (notificationId: number) => {
    await deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);

  if (!isOpen) return null;

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden"
          style={{
            top: position.top,
            right: position.right,
            zIndex: Z_INDEX.DROPDOWN,
          }}
        >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadNotifications.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {unreadNotifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadNotifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-100 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              href="/notifications"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              onClick={onClose}
            >
              View all notifications
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
    </Portal>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const IconComponent = iconMap[notification.type?.icon as keyof typeof iconMap] || Bell;
  const iconColor = colorMap[notification.type?.color as keyof typeof colorMap] || 'text-gray-500';
  const priorityStyle = priorityColors[notification.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 border-l-4 ${priorityStyle} ${!notification.is_read ? 'bg-blue-50' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                {notification.title}
              </p>
              <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
                {notification.message}
              </p>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(notification.created_at || '')}
                </span>
                {notification.context && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full">
                    {notification.context.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {!notification.is_read && (
              <button
                onClick={() => onMarkAsRead(notification.id!)}
                className="text-blue-600 hover:bg-blue-100 p-1 rounded text-xs flex items-center gap-1"
                title="Mark as read"
              >
                <Check className="h-3 w-3" />
                Mark read
              </button>
            )}
            
            {notification.action_url && (
              <Link
                href={notification.action_url}
                className="text-green-600 hover:bg-green-100 p-1 rounded text-xs flex items-center gap-1"
                title="View details"
              >
                <ExternalLink className="h-3 w-3" />
                View
              </Link>
            )}
            
            <button
              onClick={() => onDelete(notification.id!)}
              className="text-red-600 hover:bg-red-100 p-1 rounded text-xs flex items-center gap-1"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}