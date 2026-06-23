import Link from "next/link";

const STEPS = [
  {
    title: "Add a source",
    body: "Paste raw text, a web page URL, or a GitHub file link.",
  },
  {
    title: "We optimize it",
    body: "ContextForge cleans, converts, and compacts it into tidy Markdown.",
  },
  {
    title: "Copy your pack",
    body: "Grab a token-counted context pack ready for any LLM.",
  },
];

const SOURCES = ["Raw text", "Web pages", "GitHub files", "Notion (soon)"];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-semibold tracking-tight">
          ContextForge
        </span>
        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Open app
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6">
        <section className="flex flex-col items-center py-20 text-center sm:py-28">
          <span className="mb-5 rounded-full border border-black/10 px-3 py-1 text-xs font-medium text-foreground/60 dark:border-white/15">
            Context packs for LLMs
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Turn any source into perfectly optimized context.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/60">
            ContextForge transforms URLs, raw text, and GitHub files into clean,
            token-efficient Markdown packs—ready to paste into any large language
            model.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Get started free
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-black/15 px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground/5 dark:border-white/20"
            >
              Go to dashboard
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {SOURCES.map((source) => (
              <span
                key={source}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/60 dark:border-white/15"
              >
                {source}
              </span>
            ))}
          </div>
        </section>

        <section className="grid w-full gap-4 pb-24 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="rounded-xl border border-black/10 p-6 dark:border-white/15"
            >
              <span className="text-sm font-semibold text-foreground/40">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-2 font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm text-foreground/60">{step.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-sm text-foreground/50">
        Built with Next.js and Supabase.
      </footer>
    </div>
  );
}

