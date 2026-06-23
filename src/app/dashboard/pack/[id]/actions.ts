"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { estimateTokens } from "@/lib/extraction/tokenize";
import { createClient } from "@/lib/supabase/server";

export interface UpdatePackState {
  error?: string;
  ok?: boolean;
}

/**
 * Updates a context pack's title and content, recomputing the token estimate.
 * Bound to a pack id at the call site via `updatePack.bind(null, id)`.
 */
export async function updatePack(
  id: string,
  _prevState: UpdatePackState,
  formData: FormData,
): Promise<UpdatePackState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const rawContent = String(formData.get("raw_content") ?? "");

  if (!title) {
    return { error: "Title cannot be empty." };
  }

  const { error } = await supabase
    .from("context_packs")
    .update({
      title,
      raw_content: rawContent,
      token_count: estimateTokens(rawContent),
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/pack/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Deletes a context pack and returns to the dashboard. */
export async function deletePack(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("context_packs").delete().eq("id", id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
