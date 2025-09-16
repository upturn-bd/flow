import { Notification, NotificationType } from "@/lib/types/schemas";

export interface NotificationValidationResult {
  success: boolean;
  errors: Array<{ field: string; message: string }>;
}

export function validateNotification(data: Partial<Notification>): NotificationValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Required fields validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push({ field: "title", message: "Title is required" });
  } else if (data.title.length > 255) {
    errors.push({ field: "title", message: "Title must be 255 characters or less" });
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.push({ field: "message", message: "Message is required" });
  }

  if (!data.recipient_id || data.recipient_id.length === 0) {
    errors.push({ field: "recipient_id", message: "Recipient is required" });
  }

  if (!data.company_id) {
    errors.push({ field: "company_id", message: "Company ID is required" });
  }

  // Priority validation
  const validPriorities = ["low", "normal", "high", "urgent"];
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.push({ field: "priority", message: "Invalid priority level" });
  }

  // URL validation (if provided)
  if (data.action_url && data.action_url.length > 500) {
    errors.push({ field: "action_url", message: "Action URL must be 500 characters or less" });
  }

  // Context validation (if provided)
  if (data.context && data.context.length > 100) {
    errors.push({ field: "context", message: "Context must be 100 characters or less" });
  }

  // Date validations
  if (data.expires_at) {
    const expiryDate = new Date(data.expires_at);
    if (isNaN(expiryDate.getTime())) {
      errors.push({ field: "expires_at", message: "Invalid expiry date" });
    } else if (expiryDate <= new Date()) {
      errors.push({ field: "expires_at", message: "Expiry date must be in the future" });
    }
  }

  if (data.scheduled_for) {
    const scheduledDate = new Date(data.scheduled_for);
    if (isNaN(scheduledDate.getTime())) {
      errors.push({ field: "scheduled_for", message: "Invalid scheduled date" });
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

export function validateNotificationType(data: Partial<NotificationType>): NotificationValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Required fields validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: "name", message: "Name is required" });
  } else if (data.name.length > 100) {
    errors.push({ field: "name", message: "Name must be 100 characters or less" });
  }

  // Optional field validations
  if (data.icon && data.icon.length > 50) {
    errors.push({ field: "icon", message: "Icon must be 50 characters or less" });
  }

  if (data.color && data.color.length > 20) {
    errors.push({ field: "color", message: "Color must be 20 characters or less" });
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

// Helper function to convert validation errors to object format
export function validationErrorsToObject(errors: Array<{ field: string; message: string }>): Record<string, string> {
  return errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {} as Record<string, string>);
}