"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { isExcludePath, isOnboardingRoute, isAllowedPathForRole } from "@/lib/auth/path-utils";

interface EmployeeInfo {
  id: string;
  name: string;
  role: string;
  company_id: number;
  supervisor_id: string | null;
  department_id: number | null;
  has_approval: string;
  rejection_reason: string | null;
}

interface AuthInfo {
  user: any | null;
  loading: boolean;
  employee: EmployeeInfo | null;
  employeeLoading: boolean;
  redirectPath: string | null;
  signInUser: (email: string, password: string) => Promise<any>;
  signOutUser: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
}

export const AuthContext = createContext<AuthInfo | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Listen for auth state changes and fetch employee info
  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    // Set up auth state change listener
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Fetch employee data when user changes
      if (currentUser) {
        setEmployeeLoading(true);
        try {
          const info = await getUserInfo();
          if (isMounted && info) {
            // Map getUserInfo result to EmployeeInfo
            console.log("info", info);
            setEmployee({
              has_approval: info.has_approval ?? '',
              role: info.role,
              rejection_reason: info.rejection_reason ?? null,
              id: info.id,
              name: info.name,
              company_id: info.company_id,
              supervisor_id: info.supervisor_id,
              department_id: info.department_id,
            });
          }
        } catch (error) {
          if (isMounted) setEmployee(null);
        } finally {
          if (isMounted) setEmployeeLoading(false);
        }
      } else {
        if (isMounted) setEmployee(null);
        // log out the user 
        await supabase.auth.signOut();
        // clear the cookies
        fetch('/api/auth/unset-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        setUser(null);
        setLoading(false);
      }
    });

    // // Get initial session
    // supabase.auth.getUser().then(({ data }) => {
    //   const currentUser = data.user ?? null;
    //   setUser(currentUser);
    //   setLoading(false);
      
    //   // Fetch employee data for initial user
    //   if (currentUser && isMounted) {
    //     setEmployeeLoading(true);
    //     getUserInfo()
    //       .then(info => {
    //         if (isMounted && info) {
    //           setEmployee({
    //             has_approval: info.has_approval ?? '',
    //             role: info.role,
    //             rejection_reason: info.rejection_reason ?? null,
    //             id: info.id,
    //             name: info.name,
    //             company_id: info.company_id,
    //             supervisor_id: info.supervisor_id,
    //             department_id: info.department_id,
    //           });
    //         }
    //       })
    //       .catch(() => {
    //         if (isMounted) setEmployee(null);
    //       })
    //       .finally(() => {
    //         if (isMounted) setEmployeeLoading(false);
    //       });
    //   } else {
    //     if (isMounted) setEmployee(null);
    //     // log out the user 
    //   }
    // });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Route logic (moved from Picker)
  useEffect(() => {
    // We cannot use useRouter here, so we just set redirectPath
    // Exclude public paths
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    if (loading || employeeLoading) {
      setRedirectPath(null);
      return;
    }
    if (isExcludePath(pathname)) {
      setRedirectPath(null);
      return;
    }
    if (!user) {
      setRedirectPath("/signin");
      return;
    }
    if (employeeLoading) {
      setRedirectPath(null);
      return;
    }
    if (!employee) {
      if (!isOnboardingRoute(pathname)) {
        setRedirectPath("/onboarding");
        return;
      }
      setRedirectPath(null);
      return;
    }
    if (pathname === "/" || pathname === "/signin" || pathname === "/signup") {
      setRedirectPath("/home");
      return;
    }
    const { has_approval, role, rejection_reason } = employee;
    if (has_approval === "PENDING") {
      if (searchParams.get("status") !== "pending" || !isOnboardingRoute(pathname)) {
        const url = new URL("/onboarding", window.location.origin);
        url.searchParams.set("status", "pending");
        setRedirectPath(url.pathname + url.search);
        return;
      }
    } else if (has_approval === "REJECTED") {
      if (searchParams.get("status") !== "rejected" || !isOnboardingRoute(pathname)) {
        const url = new URL("/onboarding", window.location.origin);
        url.searchParams.set("status", "rejected");
        if (rejection_reason) {
          url.searchParams.set("reason", rejection_reason);
        }
        setRedirectPath(url.pathname + url.search);
        return;
      }
    } else {
      if (isOnboardingRoute(pathname)) {
        setRedirectPath("/home");
        return;
      }
      if (!isAllowedPathForRole(pathname, role as any)) {
        setRedirectPath("/unauthorized");
        return;
      }
    }
    setRedirectPath(null);
  }, [loading, employeeLoading, user, employee]);

  const signInUser = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setUser(data?.user ?? null);
    setLoading(false);
    if (error) throw error;
    if (data.session) {
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }),
      });
    }
    return data;
  }, []);

  /**
 * Get the current user's employee info (id, name, role, company_id, supervisor_id, department_id).
 */
async function getUserInfo(): Promise<{
  id: string;
  name: string;
  role: string;
  company_id: number;
  supervisor_id: string | null;
  department_id: number | null;
  has_approval: string;
  rejection_reason: string | null;
} | null> {
  try{
    console.log("getting user");
    try{
      const session = await supabase.auth.getSession();
      console.log("session", session);
    }catch (err){
      console.error("Error getting user", err);
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, company_id, supervisor_id, department_id, has_approval, rejection_reason")
      .eq("id", user?.id)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      name: `${data.first_name} ${data.last_name}`,
      role: data.role,
      company_id: data.company_id,
      supervisor_id: data.supervisor_id,
      department_id: data.department_id,
      has_approval: data.has_approval,
      rejection_reason: data.rejection_reason,
    };
  }catch(error){
    console.error("Error getting user info", error);
    return null;
  }
}

  const signOutUser = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    console.log("signInWithGoogle");
    
    const { error, data } = await supabase.auth.signInWithOAuth({ provider: "google" , options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }});
    console.log("signInWithGoogle data", data);
    setLoading(false);
    return data;
  }, []);

  const authinfo: AuthInfo = {
    user,
    loading,
    employee,
    employeeLoading,
    redirectPath,
    signInUser,
    signOutUser,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={authinfo}>
      {children}
    </AuthContext.Provider>
  );
}
