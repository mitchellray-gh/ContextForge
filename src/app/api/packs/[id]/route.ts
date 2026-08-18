import { NextResponse } from "next/server";

import { trimToBudget } from "@/lib/extraction/tokenize";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Programmatic pack retrieval — the foundation of the MCP / API surface.
 *
 * GET /api/packs/:id            → JSON metadata + content
 * GET /api/packs/:id?format=md  → raw markdown (text/markdown)
 * GET /api/packs/:id?budget=8000 → content trimmed to a token budget
 *
 * Access is session-scoped: Row Level Security ensures a caller only ever sees
 * their own packs, so no extra ownership filter is needed here.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");
  const budgetParam = searchParams.get("budget");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: pack, error } = await supabase
    .from("context_packs")
    .select(
      "id, title, token_count, source_token_count, raw_content, created_at",
    )
    .eq("id", id)
    .single();

  if (error || !pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let content = pack.raw_content;
  if (budgetParam) {
    const budget = Number(budgetParam);
    if (Number.isFinite(budget) && budget > 0) {
      content = trimToBudget(content, budget);
    }
  }

  if (format === "md" || format === "markdown") {
    return new NextResponse(content, {
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "cache-control": "private, no-store",
      },
    });
  }

  return NextResponse.json({
    id: pack.id,
    title: pack.title,
    tokenCount: pack.token_count,
    sourceTokenCount: pack.source_token_count,
    createdAt: pack.created_at,
    content,
  });
}
