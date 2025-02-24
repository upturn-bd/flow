import TabView from "./profile";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";

export default async function ProfilePage(
  props: {
    searchParams?: Promise<{
      uid?: string;
    }>
  }
) {
  const searchParams = await props.searchParams;
  const uid = searchParams?.uid;

  if (!uid) {
    const { user } = await getUser();
    redirect(`/?uid=${user?.id}`);
  }

  return (
    <div>
      <TabView uid={uid!} />
    </div>
  );
}
