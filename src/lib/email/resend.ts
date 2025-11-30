import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

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
      return { success: false, error: error.message };
    }

    return { success: true, data: data ?? undefined };
  } catch (err) {
    console.error("Failed to send email:", err);
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

export { resend };
