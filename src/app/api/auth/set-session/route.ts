import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { access_token, refresh_token } = await request.json();

  // Set the session in cookies
  await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  return NextResponse.json({ success: true });
}
