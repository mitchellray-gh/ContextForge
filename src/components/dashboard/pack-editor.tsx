"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

interface UpdateState {
  error?: string;
  ok?: boolean;
}

interface PackEditorProps {
  pack: {
    id: string;
    title: string;
    token_count: number | null;
    raw_content: string;
    created_at: string;
  };
  updateAction: (
    prevState: UpdateState,
    formData: FormData,
  ) => Promise<UpdateState>;
  deleteAction: () => Promise<void>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
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

  async function handleSave(formData: FormData) {
    const result = await updateAction({}, formData);
    if (result.error) {
      setError(result.error);
    } else {
      setError(undefined);
      setEditing(false);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(pack.raw_content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const tokens = (pack.token_count ?? 0).toLocaleString();
  const created = new Date(pack.created_at).toLocaleString();

  if (editing) {
    const labelClass = "block text-sm font-medium";
    const fieldClass =
      "mt-1.5 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

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
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/5 dark:border-white/20"
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
          <h1 className="text-2xl font-semibold tracking-tight">{pack.title}</h1>
          <p className="mt-1 text-xs text-foreground/50">
            {tokens} tokens · created {created}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copyToClipboard}
            className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/5 dark:border-white/20"
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

      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-black/10 bg-foreground/[0.03] p-4 text-sm dark:border-white/15">
        {pack.raw_content}
      </pre>
    </article>
  );
}
