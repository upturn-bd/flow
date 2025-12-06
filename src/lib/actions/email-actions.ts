"use server";

import { sendEmail, sendNotificationEmail, type SendEmailOptions, type EmailResponse, type NotificationEmailData } from "@/lib/email";

/**
 * Server action to send an email
 * This ensures emails are only sent from the server side where RESEND_API_KEY is available
 */
export async function sendEmailAction(
  options: SendEmailOptions
): Promise<EmailResponse> {
  return sendEmail(options);
}

/**
 * Server action to send a notification email
 * This ensures emails are only sent from the server side where RESEND_API_KEY is available
 */
export async function sendNotificationEmailAction(
  data: NotificationEmailData
): Promise<EmailResponse> {
  return sendNotificationEmail(data);
}

/**
 * Server action to send batch emails
 */
export async function sendBatchEmailsAction(
  emails: SendEmailOptions[]
): Promise<EmailResponse[]> {
  const results = await Promise.all(emails.map((email) => sendEmail(email)));
  return results;
}
