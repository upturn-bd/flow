import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";

// Initialize Resend client lazily to handle missing API key gracefully
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Log to Sentry that API key is missing
      Sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("email_issue", "missing_api_key");
        Sentry.captureMessage("RESEND_API_KEY environment variable is not set");
      });
      console.error("RESEND_API_KEY environment variable is not set");
      return null;
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailResponse {
  success: boolean;
  data?: { id: string };
  error?: string;
}

/**
 * Send an email using Resend
 * @param options - Email options including to, subject, and content
 * @returns EmailResponse with success status and data or error
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<EmailResponse> {
  const {
    to,
    subject,
    html,
    text,
    from = "Flow <noreply@upturn.com.bd>", // Update with your verified domain
    replyTo,
    cc,
    bcc,
  } = options;

  // Ensure at least html or text is provided
  if (!html && !text) {
    return { success: false, error: "Either html or text content is required" };
  }

  try {
    const resend = getResendClient();
    
    // If no client available (missing API key), return error
    if (!resend) {
      return { success: false, error: 'Email service not configured' };
    }
    
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : { text: text! }),
      ...(replyTo && { replyTo }),
      ...(cc && { cc: Array.isArray(cc) ? cc : [cc] }),
      ...(bcc && { bcc: Array.isArray(bcc) ? bcc : [bcc] }),
    });

    if (error) {
      console.error("Resend error:", error);
      Sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("error_type", "email");
        scope.setTag("email_provider", "resend");
        scope.setContext("email_details", {
          to: Array.isArray(to) ? to.join(", ") : to,
          subject,
          from,
        });
        scope.setContext("resend_error", {
          name: error.name,
          message: error.message,
        });
        Sentry.captureException(new Error(`Resend API Error: ${error.message}`));
      });
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? undefined };
  } catch (err) {
    console.error("Failed to send email:", err);
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("error_type", "email");
      scope.setTag("email_provider", "resend");
      scope.setContext("email_details", {
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        from,
      });
      Sentry.captureException(err);
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

/**
 * Send a batch of emails using Resend
 * @param emails - Array of email options
 * @returns Array of EmailResponse for each email
 */
export async function sendBatchEmails(
  emails: SendEmailOptions[]
): Promise<EmailResponse[]> {
  const results = await Promise.all(emails.map((email) => sendEmail(email)));
  return results;
}

// Export the getter function for cases where direct access is needed
export { getResendClient as resend };
