import { NextResponse } from "next/server";

import { generatePackFromSource } from "@/lib/extraction/generate";
import { createClient } from "@/lib/supabase/server";

/**
 * Core extraction engine endpoint. Given `{ sourceId }`, loads the caller's data
 * source, runs the engine, persists a context pack, and returns its id.
 *
 * Auth is enforced via the Supabase session; RLS guarantees the source belongs
 * to the caller.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sourceId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
  if (!sourceId) {
    return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
  }

  try {
    const result = await generatePackFromSource(supabase, {
      sourceId,
      userId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate pack";
    const status = message === "Data source not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
