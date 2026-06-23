import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateSourceForm } from "@/components/dashboard/create-source-form";
import { createClient } from "@/lib/supabase/server";

export default async function CreatePackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-foreground/60 transition-colors hover:text-foreground"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        New context pack
      </h1>
      <p className="mt-1 text-sm text-foreground/60">
        Choose a source, and ContextForge will extract and optimize it into a
        markdown pack.
      </p>

      <div className="mt-8">
        <CreateSourceForm />
      </div>
    </main>
  );
}
