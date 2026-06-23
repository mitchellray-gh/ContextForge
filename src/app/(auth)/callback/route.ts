import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Supabase OAuth callback. The provider redirects here with a `?code=...`,
 * which we exchange for a session (cookies are set via the server client).
 *
 * NOTE: this route lives in the `(auth)` route group, so its public path is
 * `/callback` (route groups do not add a URL segment). The matching value is
 * passed to `signInWithOAuth({ options: { redirectTo } })` in the login action.
 *
 * `next` defaults to `/` for now because the dashboard is not built yet; switch
 * the default to `/dashboard` once that page exists.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      if (forwardedHost) {
        // Behind a proxy/load balancer (e.g. Vercel), honor the external host.
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed — send the user back to login with an error.
  return NextResponse.redirect(`${origin}/login?error=Could not sign in`);
}
