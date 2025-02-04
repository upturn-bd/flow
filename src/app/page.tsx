import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import Profile from "./(home)/profile/page";

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <section>
      <p>Hello {data.user.email}</p>
      <Profile />
    </section>
  );
}
