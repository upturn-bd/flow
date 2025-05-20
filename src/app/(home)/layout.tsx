"use client";

import MobileBottomNav from "./mobile-bottom-nav";
import Sidebar from "./side-navbar";
import TopBar from "./top-bar";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex-1 md:ml-[80px] flex flex-col h-full">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-36 md:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
