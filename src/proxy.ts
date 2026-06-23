import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js "proxy" (formerly "middleware") — runs on every request except static
 * assets (see `matcher`) to keep the Supabase auth session fresh and the auth
 * cookies in sync. Renamed from `middleware.ts` per Next.js 16.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (build assets)
     * - _next/image (image optimization)
     * - favicon.ico
     * - common image files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
