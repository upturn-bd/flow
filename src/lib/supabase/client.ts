import { SupabaseClientOptions } from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@supabase/supabase-js";

export function createClient(options?: (SupabaseClientOptions<any>) | undefined) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  );
}
