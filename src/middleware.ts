import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getUser } from "./lib/auth/getUser";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  await updateSession(request);
  if (request.nextUrl.pathname.startsWith("/profile")) {
    if (request.nextUrl.searchParams.get("uid") === null) {
      const cookiestore = await cookies();
      const uid = cookiestore.get("uid")?.value;
      const url = request.nextUrl.clone();
      console.log(uid);
      if (uid) {
        url.searchParams.set("uid", uid);
        return NextResponse.redirect(url);
      } else{
        const { user } = await getUser();
        if (user) {
          url.searchParams.set("uid", user.id);
          cookiestore.set("uid", user.id);
          return NextResponse.redirect(url);
        }
      }
    }
  }
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
