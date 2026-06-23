import type { SupabaseClient } from "@supabase/supabase-js";

import { extract } from "./engine";
import type { ExtractionDeps, SourceType } from "./types";
import type { Database } from "@/types/database.types";

export interface GeneratePackParams {
  sourceId: string;
  userId: string;
}

export interface GeneratePackResult {
  packId: string;
  title: string;
  tokenCount: number;
}

/**
 * Loads a data source the user owns, runs the extraction engine, and persists
 * the resulting context pack. RLS already scopes access by owner; we also filter
 * on `user_id` for defense in depth. This is the Supabase-facing orchestration
 * shared by the API route and the dashboard server action.
 */
export async function generatePackFromSource(
  supabase: SupabaseClient<Database>,
  { sourceId, userId }: GeneratePackParams,
  deps?: ExtractionDeps,
): Promise<GeneratePackResult> {
  const { data: source, error: sourceError } = await supabase
    .from("data_sources")
    .select("id, source_type, source_uri, metadata")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .single();

  if (sourceError || !source) {
    throw new Error("Data source not found");
  }

  const metadata =
    source.metadata && typeof source.metadata === "object"
      ? (source.metadata as Record<string, unknown>)
      : {};

  const result = await extract(
    {
      sourceType: source.source_type as SourceType,
      sourceUri: source.source_uri,
      metadata,
    },
    deps,
  );

  const { data: pack, error: insertError } = await supabase
    .from("context_packs")
    .insert({
      user_id: userId,
      source_id: source.id,
      title: result.title,
      token_count: result.tokenCount,
      raw_content: result.content,
    })
    .select("id")
    .single();

  if (insertError || !pack) {
    throw new Error(insertError?.message ?? "Failed to save context pack");
  }

  return {
    packId: pack.id,
    title: result.title,
    tokenCount: result.tokenCount,
  };
}
