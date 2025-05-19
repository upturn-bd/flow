import MobileBottomNav from "./mobile-bottom-nav";
import Sidebar from "./side-navbar";
const HomeLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="flex h-dvh">
        <main className="flex-1 md:ml-[100px] pb-36 md:pb-0 overflow-y-auto">
          {/* <Sidebar /> */}
          {children}
          {/* <MobileBottomNav /> */}
        </main>
      </div>
    </>
  );
};

export default HomeLayout;
