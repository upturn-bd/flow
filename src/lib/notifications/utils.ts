import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

interface NotificationData {
  recipient_id: string[];
  title: string;
  message: string;
  type_id?: number;
  action_url?: string;
  metadata?: Record<string, any>;
  company_id: string;
}

/**
 * Creates a notification on the server.
 * @param notificationData - The data for the notification.
 */
export async function createServerNotification(notificationData: NotificationData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    console.error('Supabase URL or Publishable Key is not defined.');
    return { success: false, error: 'Server configuration error.' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/create_notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabasePublishableKey}`,
      },
      body: JSON.stringify({ notificationData }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error response:', errorText);
      throw new Error(errorText || 'Failed to create notification');
    }

    const data = await response.json();
    console.log('Notification created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error creating server notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
