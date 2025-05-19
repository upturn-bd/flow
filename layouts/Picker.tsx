"use client";

import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/lib/auth/auth-provider";
import HomeLayout from "./HomeLayout";
import { useRouter } from "next/navigation";

const Picker = ({ children }: { children: React.ReactNode }) => {
  const { loading, employeeLoading, redirectPath, user, employee } =
    useContext(AuthContext)!;
  const router = useRouter();

  // Prevent state updates on unmounted component
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Redirect if needed
  useEffect(() => {
    if (redirectPath) {
      router.replace(redirectPath);
    }
  }, [redirectPath, router]);

  if (loading || employeeLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen px-4 text-center"
        aria-busy="true"
      >
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-transparent"></div>
        <span className="mt-4 text-lg font-semibold">Loading...</span>
      </div>
    );
  }

  // Only wrap with HomeLayout if user and employee are present
  if (!loading && user && !employeeLoading && employee) {
    return <HomeLayout>{children}</HomeLayout>;
  }

  return <>{children}</>;
};

export default Picker;
