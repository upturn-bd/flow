"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Send, TestTube, Calendar, User, Briefcase, Clock, AlertTriangle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  createLeaveRequestNotification,
  createProjectNotification,
  createEmployeeNotification,
  createAttendanceNotification,
  createSystemNotificationHelper
} from "@/lib/utils/notifications";
import { useAuth } from "@/lib/auth/auth-context";

export default function NotificationTestPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { fetchUnreadCount } = useNotifications();
  const { employeeInfo } = useAuth();

  const sendTestNotification = async (type: string) => {
    if (!employeeInfo?.id) {
      setMessage("Please log in to test notifications");
      return;
    }

    setLoading(true);
    setMessage("Sending notification...");

    try {
      let result;
      
      switch (type) {
        case 'leave_approved':
          result = await createLeaveRequestNotification(
            employeeInfo.id,
            'approved',
            {
              leaveType: 'Annual Leave',
              startDate: '2024-03-15',
              endDate: '2024-03-20'
            },
            {
              actionUrl: '/ops/leave',
              referenceId: 123
            }
          );
          break;
          
        case 'project_assigned':
          result = await createProjectNotification(
            employeeInfo.id,
            'assigned',
            {
              projectName: 'HRIS System Enhancement',
              role: 'Lead Developer'
            },
            {
              actionUrl: '/ops/projects',
              referenceId: 456
            }
          );
          break;
          
        case 'welcome':
          result = await createEmployeeNotification(
            employeeInfo.id,
            'welcome',
            {
              employeeName: employeeInfo.name || 'User'
            }
          );
          break;
          
        case 'late_checkin':
          result = await createAttendanceNotification(
            employeeInfo.id,
            'lateCheckIn',
            {
              siteName: 'Main Office',
              time: '09:15'
            },
            {
              actionUrl: '/hris/attendance'
            }
          );
          break;
          
        case 'system_maintenance':
          result = await createSystemNotificationHelper(
            employeeInfo.id,
            'maintenance',
            {
              startTime: '2:00 AM',
              duration: '2 hours'
            }
          );
          break;
          
        default:
          throw new Error('Unknown notification type');
      }

      if (result.success) {
        setMessage("✓ Test notification sent successfully!");
        // Refresh unread count
        await fetchUnreadCount();
      } else {
        setMessage(`✗ Failed to send notification: ${result.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testButtons = [
    {
      type: 'leave_approved',
      label: 'Leave Approved',
      icon: Calendar,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Test leave request approval notification'
    },
    {
      type: 'project_assigned',
      label: 'Project Assignment',
      icon: Briefcase,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Test project assignment notification'
    },
    {
      type: 'welcome',
      label: 'Welcome Message',
      icon: User,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Test welcome notification'
    },
    {
      type: 'late_checkin',
      label: 'Late Check-in',
      icon: Clock,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Test attendance notification'
    },
    {
      type: 'system_maintenance',
      label: 'System Alert',
      icon: AlertTriangle,
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Test system maintenance notification'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <TestTube className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notification System Test</h1>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            <strong>Instructions:</strong> Click any button below to send a test notification to yourself. 
            The notification will appear in the bell icon dropdown in the top navigation bar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {testButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <motion.button
                key={button.type}
                onClick={() => sendTestNotification(button.type)}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${button.color} text-white p-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex flex-col items-center gap-2">
                  <IconComponent className="h-6 w-6" />
                  <span className="font-medium">{button.label}</span>
                  <span className="text-xs opacity-90 text-center">{button.description}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              message.includes('✓') 
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>{message}</span>
            </div>
          </motion.div>
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">How to Use the Notification System:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Notifications appear in real-time in the bell icon dropdown</li>
            <li>• Unread count is shown as a red badge on the bell icon</li>
            <li>• Click notifications to mark them as read</li>
            <li>• Use "Mark all as read" to clear all unread notifications</li>
            <li>• Some notifications include action links to relevant pages</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}