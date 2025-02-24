"use client";


import Sidebar from "./side-navbar";
import MobileBottomNav from "./mobile-bottom-nav";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr]">
      <div className="mt-32 absolute h-full md:ml-[120px] md:mt-[0px]">
        <main>{children}</main>
      </div>
      <MobileBottomNav />
      <Sidebar />
    </div>
  );
}
