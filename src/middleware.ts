import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
// import { NextRequest, NextResponse } from "next/server";

// export async function middleware(req: NextRequest): Promise<NextResponse> {
//     const res = NextResponse.next();
    
//     // Public routes that don't require authentication
//     const publicUrls = ["/auth/signin", "/auth/signup", "/auth/forgot-pass"];

//     if (publicUrls.includes(req.nextUrl.pathname)) {
//         return res;
//     }

//     // Supabase client to check authentication
//     const supabase = createMiddlewareClient({ req, res });
//     const { data } = await supabase.auth.getSession();

//     console.log("🟢", data);

//     // if (!session) {
//     //     return NextResponse.redirect(new URL("/auth/signin", req.url));
//     // }

//     return res;
// }

// export const config = {
//     matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"], 
// };
