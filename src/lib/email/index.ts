export {
  sendEmail,
  sendBatchEmails,
  resend,
  type SendEmailOptions,
  type EmailResponse,
} from "./resend";

export {
  sendNotificationEmail,
  type NotificationEmailData,
} from "./notification-email";

export {
  generateInvoiceEmailHTML,
  generateInvoiceEmailText,
  type InvoiceEmailData,
} from "./invoice-email";

// Re-export server actions for client-side use
// These are the recommended way to send emails from client components
export {
  sendEmailAction,
  sendNotificationEmailAction,
  sendBatchEmailsAction,
} from "../actions/email-actions";
