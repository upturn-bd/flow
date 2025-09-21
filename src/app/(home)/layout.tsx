"use client";

import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import MobileBottomNav from "./mobile-bottom-nav";
import Sidebar from "./side-navbar";
import TopBar from "./top-bar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ApprovalLayout>
        {children}
      </ApprovalLayout>
    </AuthProvider>
  );
}

function ApprovalLayout({ children }: { children: React.ReactNode }) {
  const { isApproved } = useAuth();

  return <div className="flex h-dvh">
  {isApproved && <Sidebar />}
  <div className={`flex-1 flex flex-col h-full`}>
    {isApproved && <TopBar />}
    <main className="flex-1 overflow-y-auto pb-36 md:pb-0">
      {children}
    </main>
  </div>
  {isApproved && <MobileBottomNav />}
</div>;
}
