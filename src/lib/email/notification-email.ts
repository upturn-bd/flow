import { sendEmail, type EmailResponse } from "./resend";

export interface NotificationEmailData {
  recipientEmail: string;
  recipientName?: string;
  title: string;
  message: string;
  priority: 'high' | 'urgent';
  actionUrl?: string;
  context?: string;
}

/**
 * Generate HTML content for a notification email
 */
function generateNotificationEmailHtml(data: NotificationEmailData): string {
  const priorityColor = data.priority === 'urgent' ? '#dc2626' : '#ea580c';
  const priorityLabel = data.priority === 'urgent' ? 'Urgent' : 'High Priority';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Priority Badge -->
        <div style="margin-bottom: 16px;">
          <span style="background-color: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
            ${priorityLabel}
          </span>
        </div>
        
        <!-- Greeting -->
        ${data.recipientName ? `<p style="margin: 0 0 16px 0; color: #374151; font-size: 14px;">Hi ${data.recipientName},</p>` : ''}
        
        <!-- Title -->
        <h1 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
          ${data.title}
        </h1>
        
        <!-- Message -->
        <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
          ${data.message}
        </p>
        
        <!-- Action Button -->
        ${data.actionUrl ? `
        <div style="margin-bottom: 24px;">
          <a href="${data.actionUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
            View Details
          </a>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
            This is an automated notification from Flow HRIS. Please do not reply to this email.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text content for a notification email
 */
function generateNotificationEmailText(data: NotificationEmailData): string {
  const priorityLabel = data.priority === 'urgent' ? '[URGENT]' : '[HIGH PRIORITY]';
  
  let text = `${priorityLabel}\n\n`;
  
  if (data.recipientName) {
    text += `Hi ${data.recipientName},\n\n`;
  }
  
  text += `${data.title}\n\n`;
  text += `${data.message}\n\n`;
  
  if (data.actionUrl) {
    text += `View Details: ${data.actionUrl}\n\n`;
  }
  
  text += `---\nThis is an automated notification from Flow HRIS. Please do not reply to this email.`;
  
  return text;
}

/**
 * Send a notification email for high priority notifications
 * @param data - Notification email data
 * @returns EmailResponse with success status
 */
export async function sendNotificationEmail(
  data: NotificationEmailData
): Promise<EmailResponse> {
  const subject = data.priority === 'urgent' 
    ? `🚨 Urgent: ${data.title}`
    : `⚠️ ${data.title}`;
    
  return sendEmail({
    to: data.recipientEmail,
    subject,
    html: generateNotificationEmailHtml(data),
    text: generateNotificationEmailText(data),
  });
}
