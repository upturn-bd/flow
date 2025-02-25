
import Sidebar from "./side-navbar";
import MobileBottomNav from "./mobile-bottom-nav";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[100px_1fr]">
      <div className="mt-32 absolute    w-full h-full">
        <main className="my-28 container mx-auto">{children}</main>
      </div>
      <MobileBottomNav />
      <Sidebar />
    </div>
  );
}
