import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";

/**
 * Hook to set Sentry user context for better error tracking
 * Call this in your root layout or app component
 */
export function useSentryUser() {
  const { user, employeeInfo } = useAuth();

  useEffect(() => {
    if (user && employeeInfo) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: employeeInfo.name,
        // Add custom context
        ip_address: "{{auto}}",
      });

      // Set additional context
      Sentry.setContext("employee", {
        company_id: employeeInfo.company_id,
        role: employeeInfo.role,
        designation: employeeInfo.designation,
        department_id: employeeInfo.department_id,
      });
    } else {
      // Clear user when logged out
      Sentry.setUser(null);
    }
  }, [user, employeeInfo]);
}

/**
 * Utility to capture custom errors with additional context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "error"
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      scope.setContext("additional", context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Utility to capture custom messages
 */
export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info"
) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (context) {
      scope.setContext("additional", context);
    }
    Sentry.captureMessage(message);
  });
}

/**
 * Utility to add breadcrumbs for better error context
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}
