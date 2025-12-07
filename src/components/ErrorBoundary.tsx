"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

/**
 * Error Boundary component that catches React errors and reports them to Sentry.
 * Wrap components that might fail with this to prevent the entire app from crashing.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary componentName="DashboardWidget" fallback={<ErrorFallback />}>
 *   <DashboardWidget />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, eventId: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report to Sentry
    Sentry.withScope((scope) => {
      scope.setTag("component", this.props.componentName || "unknown");
      scope.setContext("react", {
        componentStack: errorInfo.componentStack,
      });
      const eventId = Sentry.captureException(error);
      this.setState({ eventId });
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback or default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-error/20 bg-error/10 dark:bg-error/20 p-6">
          <svg
            className="mb-4 h-12 w-12 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-semibold text-foreground-primary">
            Something went wrong
          </h3>
          <p className="mb-4 text-center text-sm text-foreground-secondary">
            This section encountered an error. Our team has been notified.
          </p>
          {this.state.eventId && (
            <p className="mb-4 font-mono text-xs text-foreground-tertiary">
              Error ID: {this.state.eventId}
            </p>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null, eventId: null })}
            className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error/90"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback component that can be customized
 */
export function ErrorFallback({
  title = "Something went wrong",
  message = "This section encountered an error.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-border-primary bg-background-secondary dark:bg-background-tertiary p-6">
      <svg
        className="mb-4 h-10 w-10 text-foreground-tertiary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mb-2 text-lg font-medium text-foreground-primary">{title}</h3>
      <p className="mb-4 text-center text-sm text-foreground-secondary">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorBoundary;
