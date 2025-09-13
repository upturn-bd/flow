/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // or your frontend URL
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    // Preflight request: just return the headers
    return new Response(null, { status: 204, headers });
  }

  try {
    const text = await req.text();
    if (!text) {
      return new Response(JSON.stringify({ success: false, error: "Empty request body" }), { status: 400, headers });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), { status: 400, headers });
    }

    const { notificationData } = body;

    if (!notificationData?.company_id) {
      return new Response(JSON.stringify({ success: false, error: "Company ID missing" }), { status: 400, headers });
    }

    if (!notificationData?.recipient_id) {
      return new Response(JSON.stringify({ success: false, error: "recipient_id missing" }), { status: 400, headers });
    }

    const recipientIds = Array.isArray(notificationData.recipient_id)
      ? notificationData.recipient_id
      : [notificationData.recipient_id];

    const inserts = recipientIds.map((rid: string) => ({ ...notificationData, recipient_id: rid }));

    const { error } = await supabase.from("notifications").insert(inserts);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (err) {
    console.error("Error in create-notification:", err);
    return new Response(JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }), { status: 500, headers });
  }
});
