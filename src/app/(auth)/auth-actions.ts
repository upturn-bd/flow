"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

import { createClient } from "@/lib/supabase/server";
import { AuthError } from "@supabase/supabase-js";

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) : Promise<{ error?: AuthError; success?: boolean }> {
  const supabase = await createClient();

  const data = {
    email,
    password,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    Sentry.withScope((scope) => {
      scope.setTag("auth_action", "login");
      scope.setTag("error_code", error.code || "unknown");
      scope.setContext("auth_error", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      // Don't include email for privacy
      Sentry.captureException(error);
    });
    return { error };
  }

  revalidatePath("/", "layout");
  return { success: true };
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
    Sentry.withScope((scope) => {
      scope.setTag("auth_action", "signup");
      scope.setTag("error_code", error.code || "unknown");
      scope.setContext("auth_error", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      Sentry.captureException(error);
    });
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect(`/verify?email=${email}`);
}

function getSiteUrl(){
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
    Sentry.withScope((scope) => {
      scope.setTag("auth_action", "google_signin");
      scope.setTag("error_code", error.code || "unknown");
      scope.setContext("auth_error", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      Sentry.captureException(error);
    });
    throw error;
  }

  revalidatePath("/", "layout");
  redirect(response.data.url);
}

export async function logout(){
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    Sentry.withScope((scope) => {
      scope.setTag("auth_action", "logout");
      scope.setTag("error_code", error.code || "unknown");
      scope.setContext("auth_error", {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      Sentry.captureException(error);
    });
    throw error;
  }
  redirect("/login");
}
