import TabView from "@/components/profile/tab-bar";


export default async function HomeLayout({
  children,
  
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <TabView />
      <main>{children}</main>
    </div>
  );
}
