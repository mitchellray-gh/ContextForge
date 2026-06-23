import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PackEditor } from "@/components/dashboard/pack-editor";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

import { deletePack, updatePack } from "./actions";

export default async function PackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pack } = await supabase
    .from("context_packs")
    .select("id, title, token_count, raw_content, created_at")
    .eq("id", id)
    .single();

  if (!pack) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-foreground/60 transition-colors hover:text-foreground"
      >
        ← Back to dashboard
      </Link>

      <div className="mt-4">
        <PackEditor
          pack={pack}
          updateAction={updatePack.bind(null, pack.id)}
          deleteAction={deletePack.bind(null, pack.id)}
        />
      </div>
    </main>
  );
}
