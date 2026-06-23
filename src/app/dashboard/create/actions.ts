"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generatePackFromSource } from "@/lib/extraction/generate";
import { SUPPORTED_SOURCE_TYPES, type SourceType } from "@/lib/extraction/types";
import { createClient } from "@/lib/supabase/server";

export interface CreatePackState {
  error?: string;
}

/**
 * Creates a data source from the submitted form, runs the extraction engine, and
 * redirects to the resulting pack. Returns `{ error }` for inline display when
 * validation or extraction fails.
 */
export async function createPack(
  _prevState: CreatePackState,
  formData: FormData,
): Promise<CreatePackState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sourceType = String(formData.get("sourceType") ?? "") as SourceType;
  const source = String(formData.get("source") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!SUPPORTED_SOURCE_TYPES.includes(sourceType)) {
    return { error: "Please choose a supported source type." };
  }
  if (!source) {
    return { error: "Please provide a URL or some text to extract." };
  }

  const { data: dataSource, error: sourceError } = await supabase
    .from("data_sources")
    .insert({
      user_id: user.id,
      source_type: sourceType,
      source_uri: source,
      metadata: title ? { title } : {},
    })
    .select("id")
    .single();

  if (sourceError || !dataSource) {
    return { error: sourceError?.message ?? "Could not save the data source." };
  }

  let packId: string;
  try {
    const result = await generatePackFromSource(supabase, {
      sourceId: dataSource.id,
      userId: user.id,
    });
    packId = result.packId;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Extraction failed.",
    };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/pack/${packId}`);
}
