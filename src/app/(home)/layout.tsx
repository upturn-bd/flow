import MobileBottomNav from "./mobile-bottom-nav";
import Sidebar from "./side-navbar";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <main className="flex-1 md:ml-[100px] pb-36 md:pb-0 overflow-y-auto">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
