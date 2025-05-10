"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@supabase/supabase-js";

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) : Promise<{ error?: AuthError }> {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

function getSiteUrl(){
  console.log(process.env.NODE_ENV);
  
  if (process.env.NODE_ENV === "production") {
    return "https://flow.upturn.com.bd";
  }
  return "http://localhost:3000";
}

export async function googleSignIn(){
  const supabase = await createClient();

  const response = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options:{
      redirectTo: getSiteUrl() + "/auth/callback",
    }
  });

  const error = response.error;

  if (error) {
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(response.data.url);
}