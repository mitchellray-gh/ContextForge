import Link from "next/link";
import { redirect } from "next/navigation";

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
    .select("id, title, token_count, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Context packs
          </h1>
          <p className="mt-1 text-sm text-foreground/60">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/create"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            New pack
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5 dark:border-white/20"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {!packs || packs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-black/15 p-12 text-center dark:border-white/20">
          <p className="text-sm text-foreground/60">
            No context packs yet. Create your first one to get started.
          </p>
          <Link
            href="/dashboard/create"
            className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Create a context pack
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {packs.map((pack) => (
            <li key={pack.id}>
              <Link
                href={`/dashboard/pack/${pack.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-black/10 px-4 py-3 transition-colors hover:bg-foreground/5 dark:border-white/15"
              >
                <span className="truncate font-medium">{pack.title}</span>
                <span className="shrink-0 text-xs text-foreground/50">
                  {(pack.token_count ?? 0).toLocaleString()} tokens ·{" "}
                  {new Date(pack.created_at).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
