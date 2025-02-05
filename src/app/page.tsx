import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getUser();

  return (
    <section>
      <p>Hello {data.user?.email}</p>
    </section>
  );
}
