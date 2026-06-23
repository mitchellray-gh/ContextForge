import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/types/database.types";

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route
 * Handlers. In Next.js 15+ `cookies()` is asynchronous and must be awaited.
 *
 * Reads:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * Typed with the generated `Database` types so every query is type-checked.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component. This can
            // be safely ignored when middleware refreshes the user session.
          }
        },
      },
    },
  );
}

/**
 * Whether the Supabase environment variables are configured. Pages and route
 * handlers use this to fail gracefully (redirect or 503) instead of throwing a
 * 500 when the deployment has not yet been connected to a Supabase project.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
