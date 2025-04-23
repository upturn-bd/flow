import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { getUser } from "./lib/auth/getUser";
import { createClient } from "./lib/supabase/server";

type Role = "Employee" | "Manager" | "Admin";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const url = request.nextUrl.clone();
  const currentPath = url.pathname;

  const isApi = currentPath.startsWith("/api");

  // Allow unauthenticated access to these paths
  const excludePaths = ["/signin", "/signup", "/auth", "/unauthorized"];
  if (!isApi && excludePaths.some((p) => currentPath.startsWith(p))) {
    return response;
  }

  // Auth check
  const { user } = await getUser();
  if (!user) {
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // Redirect "/" to "/profile"
  if (currentPath === "/") {
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("has_approval, role, rejection_reason")
    .eq("id", user.id)
    .single();

  const isOnboardingRoute = currentPath === "/onboarding";

  // No employee record → allow onboarding
  if (!employee || error) {
    if (!isOnboardingRoute) {
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }
    return response;
  }

  const { has_approval, role: queriedRole, rejection_reason } = employee;
  const role = queriedRole as Role;

  if (has_approval === "PENDING") {
    if (!url.searchParams.has("status") || url.searchParams.get("status") !== "pending") {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "pending");
      return NextResponse.redirect(url);
    }

    // Prevent user from accessing onboarding page content
    if (isOnboardingRoute && url.searchParams.get("status") !== "pending") {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "pending");
      return NextResponse.redirect(url);
    }

    return response;
  }

  if (has_approval === "REJECTED") {
    if (!url.searchParams.has("status") || url.searchParams.get("status") !== "rejected") {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "rejected");
      // Include rejection reason in query params if available
      if (rejection_reason) {
        url.searchParams.set("reason", rejection_reason);
      }
      return NextResponse.redirect(url);
    }

    if (isOnboardingRoute && url.searchParams.get("status") !== "rejected") {
      url.pathname = "/onboarding";
      url.searchParams.set("status", "rejected");
      // Include rejection reason in query params if available
      if (rejection_reason) {
        url.searchParams.set("reason", rejection_reason);
      }
      return NextResponse.redirect(url);
    }

    return response;
  }

  // If approved and trying to access /onboarding, redirect to profile
  if (isOnboardingRoute) {
    url.pathname = "/profile";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Role-based access check
  const rolePermissions: Record<Role, string[]> = {
    Employee: ["/profile", "/operations-and-services"],
    Manager: ["/profile", "/operations-and-services", "/admin-management"],
    Admin: ["/profile", "/operations-and-services", "/admin-management", "/dashboard"],
  };

  const isAllowed = rolePermissions[role]?.some((path) =>
    currentPath.startsWith(path)
  );

  if (!isAllowed) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
