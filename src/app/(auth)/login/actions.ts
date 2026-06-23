"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Kicks off a Supabase OAuth sign-in. Runs on the server (server-first), then
 * redirects the browser to the provider's consent screen. The provider sends
 * the user back to `/callback`, which exchanges the code for a session.
 */
async function signInWithProvider(provider: Provider) {
  if (!isSupabaseConfigured()) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Sign-in isn't configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
      )}`,
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signInWithGitHub() {
  await signInWithProvider("github");
}

export async function signInWithGoogle() {
  await signInWithProvider("google");
}
