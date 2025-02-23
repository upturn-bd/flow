"use client";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/client";

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createClient();

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
}

export async function signup({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    console.error(error);
  }

  revalidatePath("/", "layout");
}

export async function googleSignIn(){
  const supabase = createClient();

  const response = await supabase.auth.signInWithOAuth({
    provider: 'google',
    // options:{
    //   redirectTo: "http://localhost:3000/auth/callback",
    // }
  });

  const error = response.error;

  if (error) {
    throw error;
  }

  revalidatePath("/", "layout");
}