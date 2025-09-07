# Notification System Documentation

## Overview

Flow notification system provides a comprehensive, real-time notification service that operates independently from the existing notices section. The system follows the project's established patterns and conventions.

## Features

- **Real-time Notifications**: Instant notification delivery with live unread count updates
- **Priority Levels**: Support for low, normal, high, and urgent priority notifications
- **Contextual Categories**: Organized by context (leave_request, project_update, employee_update, attendance, system_alert)
- **Rich Metadata**: Support for action URLs, reference links, and custom metadata
- **Company Scoped**: All notifications are scoped to company and user
- **Expiry Support**: Optional expiry dates for time-sensitive notifications
- **Interactive UI**: Modern dropdown interface with mark as read, delete, and action capabilities

## Database Schema

### Main Tables

#### `notifications`
- **id**: Primary key
- **title**: Notification title (max 255 chars)
- **message**: Notification content
- **type_id**: Reference to notification_types
- **priority**: 'low' | 'normal' | 'high' | 'urgent'
- **recipient_id**: Employee ID receiving the notification
- **sender_id**: Employee ID who triggered the notification (optional)
- **is_read**: Boolean read status
- **read_at**: Timestamp when marked as read
- **action_url**: Optional URL for actions
- **metadata**: JSONB for flexible data storage
- **context**: Context category (e.g., 'leave_request')
- **reference_id**: ID of related record
- **reference_table**: Table name of related record
- **company_id**: Company scoping (required)
- **department_id**: Optional department scoping
- **expires_at**: Optional expiry timestamp
- **scheduled_for**: Optional scheduled delivery
- **created_at/updated_at**: Standard timestamps

#### `notification_types`
- **id**: Primary key
- **name**: Type name
- **description**: Type description
- **icon**: UI icon identifier
- **color**: UI color identifier
- **company_id**: Optional company scoping

#### `notification_preferences` (Optional - Future Enhancement)
- User-specific notification preferences
- Email/push notification settings
- Quiet hours configuration

## TypeScript Interfaces

```typescript
interface Notification {
  id?: number;
  title: string;
  message: string;
  type_id?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recipient_id: string;
  sender_id?: string;
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  metadata?: Record<string, any>;
  context?: string;
  reference_id?: number;
  reference_table?: string;
  company_id: number;
  department_id?: number;
  expires_at?: string;
  scheduled_for?: string;
  created_at?: string;
  updated_at?: string;
  type?: NotificationType;
}

interface NotificationType {
  id?: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}
```

## Hook Usage

### `useNotifications()`

The main hook for notification management:

```typescript
const {
  // Data
  notifications,
  notification,
  unreadCount,
  
  // Loading states
  loading,
  creating,
  updating,
  deleting,
  error,
  
  // Actions
  fetchUserNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  
  // Base CRUD
  fetchNotifications,
  fetchNotification,
  updateNotification,
} = useNotifications();
```

### `useNotificationTypes()`

For managing notification types:

```typescript
const {
  notificationTypes,
  notificationType,
  fetchNotificationTypes,
  createNotificationType,
  updateNotificationType,
  deleteNotificationType,
} = useNotificationTypes();
```

## Creating Notifications

### Direct Creation

```typescript
import { createSystemNotification } from "@/hooks/useNotifications";

const result = await createSystemNotification(
  recipientId,
  "Notification Title",
  "Notification message content",
  {
    priority: "high",
    context: "leave_request",
    actionUrl: "/operations-and-services/services/leave",
    metadata: { requestId: 123 },
    referenceId: 123,
    referenceTable: "leave_requests"
  }
);
```

### Template-based Creation

```typescript
import { createLeaveRequestNotification } from "@/lib/utils/notifications";

const result = await createLeaveRequestNotification(
  recipientId,
  'approved',
  {
    leaveType: 'Annual Leave',
    startDate: '2024-03-15',
    endDate: '2024-03-20'
  },
  {
    actionUrl: '/operations-and-services/services/leave',
    referenceId: 123
  }
);
```

## Available Notification Templates

### Leave Request Notifications
- `submitted`: When a leave request is submitted
- `approved`: When a leave request is approved
- `rejected`: When a leave request is rejected

### Project Notifications
- `assigned`: When assigned to a project
- `milestone`: When a project milestone is completed
- `deadline`: When project deadline is approaching

### Employee Notifications
- `welcome`: Welcome message for new employees
- `profileUpdate`: Profile field updates
- `documentRequired`: Required document uploads

### Attendance Notifications
- `lateCheckIn`: Late check-in alerts
- `missedCheckOut`: Missed check-out alerts

### System Notifications
- `maintenance`: System maintenance alerts
- `update`: System update notifications

## UI Components

### `NotificationDropdown`

The main UI component for displaying notifications:

```typescript
<NotificationDropdown
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  triggerRef={buttonRef}
/>
```

### Integration in TopBar

The notification system is integrated into the main top bar:

```typescript
// Shows unread count and handles dropdown
<button onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}>
  <Bell className="h-5 w-5" />
  {unreadCount > 0 && (
    <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
  )}
</button>
```

## Validation

Notifications are validated using pure TypeScript functions:

```typescript
import { validateNotification, validationErrorsToObject } from "@/lib/validation/notifications";

const validationResult = validateNotification(notificationData);
if (!validationResult.success) {
  const errors = validationErrorsToObject(validationResult.errors);
  // Handle validation errors
}
```

## File Structure

```
src/
├── hooks/
│   └── useNotifications.tsx           # Main notification hook
├── components/
│   └── notifications/
│       ├── NotificationDropdown.tsx   # Main UI component
│       └── NotificationTestPage.tsx   # Test interface
├── lib/
│   ├── types/
│   │   └── schemas.ts                 # Type definitions
│   ├── validation/
│   │   └── notifications.ts           # Validation functions
│   └── utils/
│       └── notifications.ts           # Template helpers
├── app/(home)/
│   ├── top-bar.tsx                    # Updated with notification integration
│   └── test-notifications/
│       └── page.tsx                   # Test page
└── sql/
    └── notifications_table.sql        # Database schema
```

## Testing

A test page is available at `/test-notifications` that allows you to:

1. Send test notifications of different types
2. Verify unread count updates
3. Test the dropdown interface
4. Validate notification actions and links

## Best Practices

1. **Always specify priority**: Use appropriate priority levels for different notification types
2. **Include context**: Categorize notifications with meaningful context values
3. **Provide action URLs**: Include relevant links when notifications relate to specific actions
4. **Use templates**: Leverage predefined templates for consistency
5. **Company scoping**: All notifications are automatically company-scoped
6. **Error handling**: Always check return values from notification creation functions

## Future Enhancements

1. **Real-time updates**: Add WebSocket support for instant notification delivery
2. **Email notifications**: Integrate with email service for important notifications
3. **Push notifications**: Add browser push notification support
4. **Notification preferences**: Allow users to customize notification settings
5. **Batch operations**: Support for bulk notification operations
6. **Notification center**: Dedicated page for notification management

## Integration Examples

### Leave Request Workflow

```typescript
// When a leave request is submitted
const result = await createLeaveRequestNotification(
  supervisorId,
  'submitted',
  {
    employeeName: employee.name,
    leaveType: leaveRequest.type,
    startDate: leaveRequest.start_date,
    endDate: leaveRequest.end_date
  },
  {
    referenceId: leaveRequest.id,
    actionUrl: `/admin-management/leave-requests/${leaveRequest.id}`
  }
);

// When leave is approved
const result = await createLeaveRequestNotification(
  employeeId,
  'approved',
  {
    leaveType: leaveRequest.type,
    startDate: leaveRequest.start_date,
    endDate: leaveRequest.end_date
  },
  {
    referenceId: leaveRequest.id,
    actionUrl: `/operations-and-services/services/leave`
  }
);
```

### Project Assignment

```typescript
const result = await createProjectNotification(
  employeeId,
  'assigned',
  {
    projectName: project.name,
    role: assignment.role
  },
  {
    referenceId: project.id,
    actionUrl: `/operations-and-services/projects/${project.id}`
  }
);
```

This notification system provides a robust, scalable foundation for all notification needs within the Flow HRIS application.