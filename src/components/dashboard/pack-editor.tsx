"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  countTokens,
  formatTokenDelta,
  trimToBudget,
} from "@/lib/extraction/tokenize";

interface UpdateState {
  error?: string;
  ok?: boolean;
}

interface PackEditorProps {
  pack: {
    id: string;
    title: string;
    token_count: number | null;
    source_token_count: number | null;
    raw_content: string;
    created_at: string;
  };
  updateAction: (
    prevState: UpdateState,
    formData: FormData,
  ) => Promise<UpdateState>;
  deleteAction: () => Promise<void>;
}

const BUDGET_PRESETS = [4000, 8000, 32000, 128000] as const;

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

/** A thin animated bar that fills toward the budget and warms amber→red. */
function TokenMeter({ tokens, budget }: { tokens: number; budget: number }) {
  const ratio = budget > 0 ? Math.min(tokens / budget, 1) : 0;
  const over = tokens > budget;
  const color = over ? "#dc2626" : ratio > 0.85 ? "#d97706" : "var(--accent)";
  return (
    <div className="w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${ratio * 100}%`, background: color }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
        <span className="tabular">
          {tokens.toLocaleString()} / {budget.toLocaleString()} tokens
        </span>
        {over ? (
          <span className="tabular font-medium text-red-600 dark:text-red-400">
            {(tokens - budget).toLocaleString()} over budget
          </span>
        ) : (
          <span className="tabular">
            {(budget - tokens).toLocaleString()} to spare
          </span>
        )}
      </div>
    </div>
  );
}

export function PackEditor({
  pack,
  updateAction,
  deleteAction,
}: PackEditorProps) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [budget, setBudget] = useState<number>(8000);

  const optimizedTokens = pack.token_count ?? countTokens(pack.raw_content);
  const sourceTokens = pack.source_token_count ?? 0;

  const trimmed = useMemo(
    () => trimToBudget(pack.raw_content, budget),
    [pack.raw_content, budget],
  );
  const trimmedTokens = useMemo(() => countTokens(trimmed), [trimmed]);
  const isTrimmed = trimmed !== pack.raw_content;

  async function handleSave(formData: FormData) {
    const result = await updateAction({}, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setError(undefined);
      setEditing(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function download() {
    const blob = new Blob([isTrimmed ? trimmed : pack.raw_content], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug =
      pack.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "context-pack";
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const created = new Date(pack.created_at).toLocaleString();

  if (editing) {
    const labelClass = "block text-sm font-medium";
    const fieldClass =
      "mt-1.5 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent/60";

    return (
      <form action={handleSave} className="flex flex-col gap-5">
        {error ? (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}

        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={pack.title}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="raw_content" className={labelClass}>
            Content
          </label>
          <textarea
            id="raw_content"
            name="raw_content"
            defaultValue={pack.raw_content}
            rows={18}
            className={`${fieldClass} resize-y font-mono`}
          />
        </div>

        <div className="flex items-center gap-2">
          <SaveButton />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <article>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{pack.title}</h1>
          <p className="mt-1 text-xs text-muted">created {created}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() =>
              copyToClipboard(isTrimmed ? trimmed : pack.raw_content)
            }
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            {copied ? "Copied!" : isTrimmed ? "Copy trimmed" : "Copy"}
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Download .md
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/5"
          >
            Edit
          </button>
          <form action={deleteAction}>
            <button
              type="submit"
              onClick={(event) => {
                if (!window.confirm("Delete this context pack?")) {
                  event.preventDefault();
                }
              }}
              className="rounded-md border border-red-500/30 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              Delete
            </button>
          </form>
        </div>
      </header>

      {sourceTokens > 0 ? (
        <div className="mb-5 rounded-lg border border-border bg-panel px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Raw → optimized
          </p>
          <p className="tabular mt-1 text-lg font-semibold">
            {formatTokenDelta(sourceTokens, optimizedTokens)}
          </p>
        </div>
      ) : null}

      <div className="mb-5 rounded-lg border border-border bg-panel px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <label htmlFor="budget" className="text-sm font-medium">
            Token budget
          </label>
          <div className="flex gap-1">
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBudget(preset)}
                className={`tabular rounded px-2 py-1 text-xs transition-colors ${
                  budget === preset
                    ? "bg-accent text-accent-fg"
                    : "border border-border hover:bg-foreground/5"
                }`}
              >
                {preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>
        </div>
        <input
          id="budget"
          type="range"
          min={500}
          max={128000}
          step={500}
          value={budget}
          onChange={(event) => setBudget(Number(event.target.value))}
          className="mb-3 w-full accent-[var(--accent)]"
        />
        <TokenMeter
          tokens={isTrimmed ? trimmedTokens : optimizedTokens}
          budget={budget}
        />
        {isTrimmed ? (
          <p className="mt-2 text-xs text-muted">
            Preview and exports are trimmed to fit your budget. The saved pack is
            unchanged.
          </p>
        ) : null}
      </div>

      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-foreground/[0.03] p-4 font-mono text-sm">
        {isTrimmed ? trimmed : pack.raw_content}
      </pre>
    </article>
  );
}
