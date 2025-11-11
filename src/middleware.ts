import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getUserFromServer } from "./lib/auth/getUser";
import { createClient } from "./lib/supabase/server";
import { authRoutes, excludePaths } from "./lib/utils/path-utils";

// ✅ Add /verify to excluded paths at runtime (in case it's not inside path-utils)
const UPDATED_EXCLUDE_PATHS = [...excludePaths, "/verify"];

// Permission-based route access mappings
const ROUTE_PERMISSION_MAP: Record<string, { module: string; action: string }> = {
  "/admin": { module: "teams", action: "can_write" },
  "/finder": { module: "hris", action: "can_read" },
  // Most other routes are accessible if user has any permission
};

export async function middleware(request: NextRequest) {
  // Initialize Supabase client for session management
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user info from Supabase
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const currentPath = url.pathname;

  console.log("🔐 [MIDDLEWARE] Processing path:", currentPath);

  // Check if current path starts with any auth route
  const isAuthRoute = authRoutes.some((route) =>
    currentPath.startsWith(route)
  );

  // ✅ Updated exclusion check (includes /verify)
  const isExcludedPath = UPDATED_EXCLUDE_PATHS.some(
    (path) => currentPath === path || currentPath.startsWith(`${path}/`)
  );

  // Handle auth routes redirections
  if (!supabaseUser && !isAuthRoute && !isExcludedPath) {
    console.log("❌ [MIDDLEWARE] No user found, redirecting to login");
    url.pathname = "/login";
    return NextResponse.redirect(url);
  } else if (supabaseUser && isAuthRoute) {
    console.log("✅ [MIDDLEWARE] User authenticated on auth route, redirecting to profile");
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  // ✅ Allow excluded paths (like /verify) to pass through
  if (isExcludedPath) {
    console.log("⏭️  [MIDDLEWARE] Path excluded from checks:", currentPath);
    return response;
  }

  console.log("🔍 [MIDDLEWARE] User ID:", supabaseUser?.id);

  // Get user data from context
  const { user } = await getUserFromServer();
  if (!user) {
    console.log("❌ [MIDDLEWARE] No user from server, redirecting to login");
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  console.log("👤 [MIDDLEWARE] User from server:", user.id);

  // Redirect "/" to "/home"
  if (currentPath === "/") {
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Check employee status from database
  const dbClient = await createClient();
  const { data: employee, error } = await dbClient
    .from("employees")
    .select("has_approval, rejection_reason, company_id")
    .eq("id", user.id)
    .single();

  console.log("👔 [MIDDLEWARE] Employee data:", {
    has_approval: employee?.has_approval,
    company_id: employee?.company_id,
    error: error?.message,
  });

  const isOnboardingRoute = currentPath === "/onboarding";

  // If no employee record found, redirect to onboarding
  if (!employee || error) {
    console.log("⚠️  [MIDDLEWARE] No employee record, redirecting to onboarding");
    if (!isOnboardingRoute) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const { has_approval, rejection_reason } = employee;

  // Handle pending approval state
  if (has_approval === "PENDING") {
    console.log("⏳ [MIDDLEWARE] User approval pending");
    if (
      !url.searchParams.has("status") ||
      url.searchParams.get("status") !== "pending"
    ) {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "pending");
      return NextResponse.redirect(url);
    }
    if (isOnboardingRoute && url.searchParams.get("status") !== "pending") {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "pending");
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Handle rejected approval state
  if (has_approval === "REJECTED") {
    console.log("🚫 [MIDDLEWARE] User approval rejected");
    if (
      !url.searchParams.has("status") ||
      url.searchParams.get("status") !== "rejected"
    ) {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "rejected");
      if (rejection_reason) {
        url.searchParams.set("reason", rejection_reason);
      }
      return NextResponse.redirect(url);
    }
    if (isOnboardingRoute && url.searchParams.get("status") !== "rejected") {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "rejected");
      if (rejection_reason) {
        url.searchParams.set("reason", rejection_reason);
      }
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Redirect away from onboarding if already approved
  if (isOnboardingRoute) {
    console.log("✅ [MIDDLEWARE] User approved, redirecting away from onboarding");
    url.pathname = "/hris";
    url.search = "";
    return NextResponse.redirect(url);
  }

  console.log("🔐 [MIDDLEWARE] Checking permissions for approved user");

  // Permission-based access control
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
    (route) => currentPath === route || currentPath.startsWith(`${route}/`)
  );

  if (matchedRoute) {
    console.log("🎯 [MIDDLEWARE] Route requires specific permission:", matchedRoute);
    const requiredPermission = ROUTE_PERMISSION_MAP[matchedRoute];
    console.log("📋 [MIDDLEWARE] Required permission:", requiredPermission);

    const { data: hasAccess, error: permError } = await dbClient.rpc("has_permission", {
      user_id: user.id,
      module: requiredPermission.module,
      action: requiredPermission.action,
    });

    console.log("🔍 [MIDDLEWARE] Permission check result:", {
      hasAccess,
      error: permError?.message,
      code: permError?.code,
    });

    if (permError && permError.code === "42883") {
      console.warn("⚠️  [MIDDLEWARE] Permission RPC not found, temporarily allowing access");
      return response;
    }

    if (permError) {
      console.error("❌ [MIDDLEWARE] Permission check error:", permError);
    }

    if (!hasAccess) {
      console.log("🚫 [MIDDLEWARE] Access denied - insufficient permissions");
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    console.log("✅ [MIDDLEWARE] Permission check passed");
  }

  // Fallback: require at least one permission
  const { data: userPermissions, error: userPermError } = await dbClient.rpc(
    "get_user_permissions",
    { user_id: user.id }
  );

  console.log("📊 [MIDDLEWARE] User permissions:", {
    count: userPermissions?.length || 0,
    error: userPermError?.message,
    code: userPermError?.code,
  });

  if (userPermError && userPermError.code === "42883") {
    console.warn("⚠️  [MIDDLEWARE] Permission RPCs not found, skipping checks");
    return response;
  }

  if (userPermError) {
    console.error("❌ [MIDDLEWARE] Error fetching user permissions:", userPermError);
  }

  if (!userPermissions || userPermissions.length === 0) {
    console.log("🚫 [MIDDLEWARE] User has no permissions - no team membership");
    const { data: teamCheck } = await dbClient
      .from("team_members")
      .select("team_id")
      .eq("employee_id", user.id);

    console.log("🔍 [MIDDLEWARE] Team membership check:", teamCheck);

    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  console.log("✅ [MIDDLEWARE] All checks passed, allowing access to:", currentPath);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*|swe-worker.*|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
