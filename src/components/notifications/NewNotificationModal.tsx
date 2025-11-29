"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Eye, Trash2, AlertCircle, Calendar, Briefcase, User, Clock, Bell } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { fadeIn, fadeInUp } from "@/components/ui/animations";

interface NewNotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
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
  'red': 'text-red-500 bg-red-50',
  'blue': 'text-blue-500 bg-blue-50',
  'green': 'text-green-500 bg-green-50',
  'purple': 'text-purple-500 bg-purple-50',
  'orange': 'text-orange-500 bg-orange-50',
  'gray': 'text-gray-500 bg-gray-50',
};

const priorityColors = {
  'urgent': 'border-red-500 bg-red-50',
  'high': 'border-orange-500 bg-orange-50',
  'normal': 'border-blue-500 bg-blue-50',
  'low': 'border-gray-500 bg-gray-50',
};

const priorityLabels = {
  'urgent': 'Urgent',
  'high': 'High Priority',
  'normal': 'Normal',
  'low': 'Low Priority',
};

export default function NewNotificationModal({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete,
}: NewNotificationModalProps) {
  const router = useRouter();

  if (!notification) return null;

  const iconName = (notification.type?.icon || 'bell') as keyof typeof iconMap;
  const IconComponent = iconMap[iconName] || Bell;
  const colorName = (notification.type?.color || 'blue') as keyof typeof colorMap;
  const colorClass = colorMap[colorName] || colorMap.blue;

  const handleView = () => {
    if (notification.action_url) {
      onMarkAsRead(notification.id!);
      onClose();
      router.push(notification.action_url);
    }
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id!);
    onClose();
  };

  const handleDelete = () => {
    onDelete(notification.id!);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={handleBackdropClick}
        >
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-6 py-4 border-l-4 ${priorityColors[notification.priority]}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2.5 rounded-lg ${colorClass}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-base">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {priorityLabels[notification.priority]} · {formatRelativeTime(notification.created_at!)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                {notification.message}
              </p>
              
              {notification.context && (
                <div className="mt-4 text-xs text-gray-500 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
                  <span className="font-medium">Context:</span> {notification.context}
                </div>
              )}
            </div>

            {/* Footer with Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-3">
              {notification.action_url && (
                <button
                  onClick={handleView}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              )}
              
              {!notification.is_read && (
                <button
                  onClick={handleMarkAsRead}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  Mark as Read
                </button>
              )}
              
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-200"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
