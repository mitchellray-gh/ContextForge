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

export interface MagicLinkState {
  error?: string;
  success?: boolean;
}

/**
 * Sends a passwordless magic-link / OTP email. Opening the link returns the user
 * to `/callback`, which exchanges the code for a session. New users are created
 * automatically. Uses Supabase's built-in email sender (no SMTP setup required).
 */
export async function signInWithMagicLink(
  _prevState: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Sign-in isn't configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy.",
    };
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
