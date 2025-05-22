import { createBrowserClient } from '@supabase/ssr'

// Add WebSocket polyfill for cross-environment compatibility
if (typeof window !== 'undefined') {
  // Browser environment - use native WebSocket
  global.WebSocket = window.WebSocket
} else {
  // Server environment - use ws package
  const ws = require('ws')
  global.WebSocket = ws
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  )
}

export const supabase = createClient();
