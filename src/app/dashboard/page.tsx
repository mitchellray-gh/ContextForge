import Link from "next/link";
import { redirect } from "next/navigation";

import { CommandPalette } from "@/components/dashboard/command-palette";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

import { signOut } from "./actions";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: packs } = await supabase
    .from("context_packs")
    .select("id, title, token_count, source_token_count, created_at")
    .order("created_at", { ascending: false });

  const totalSaved = (packs ?? []).reduce((sum, pack) => {
    const saved = (pack.source_token_count ?? 0) - (pack.token_count ?? 0);
    return sum + Math.max(0, saved);
  }, 0);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <CommandPalette packs={(packs ?? []).map((p) => ({ id: p.id, title: p.title }))} />
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Context packs
          </h1>
          <p className="mt-1 text-sm text-muted">
            {user.email}
            {totalSaved > 0 ? (
              <>
                {" · "}
                <span className="tabular">
                  {totalSaved.toLocaleString()}
                </span>{" "}
                tokens saved
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/create"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            New pack
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <p className="mb-4 text-xs text-muted">
        Press{" "}
        <kbd className="tabular rounded border border-border px-1.5 py-0.5">
          ⌘K
        </kbd>{" "}
        to search or jump to any pack.
      </p>

      {!packs || packs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted">
            No context packs yet. Create your first one to get started.
          </p>
          <Link
            href="/dashboard/create"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            Create a context pack
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {packs.map((pack) => {
            const saved =
              (pack.source_token_count ?? 0) - (pack.token_count ?? 0);
            return (
              <li key={pack.id}>
                <Link
                  href={`/dashboard/pack/${pack.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-panel px-4 py-3 transition-colors hover:bg-foreground/5"
                >
                  <span className="truncate font-medium">{pack.title}</span>
                  <span className="tabular shrink-0 text-xs text-muted">
                    {(pack.token_count ?? 0).toLocaleString()} tokens
                    {saved > 0 ? ` · −${saved.toLocaleString()}` : ""} ·{" "}
                    {new Date(pack.created_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
