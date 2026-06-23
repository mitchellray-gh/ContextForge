import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database.types";

/**
 * Refreshes the Supabase auth session on every matched request and forwards the
 * rotated auth cookies to both the request (for Server Components rendered in
 * this pass) and the response (so the browser stores them). This is the
 * canonical `@supabase/ssr` middleware pattern for the Next.js App Router.
 *
 * IMPORTANT: do not run other logic between `createServerClient` and
 * `getUser()`, and always return `supabaseResponse` so the cookies survive.
 */
export async function updateSession(request: NextRequest) {
  // Boundary guard: until the Supabase env vars are configured, skip session
  // handling so the app still renders (e.g. the landing page) without a 500.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touch the user to trigger a token refresh if needed. Do not remove.
  await supabase.auth.getUser();

  return supabaseResponse;
}
