"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { createPack, type CreatePackState } from "@/app/dashboard/create/actions";
import type { SourceType } from "@/lib/extraction/types";

const SOURCE_OPTIONS: { value: SourceType; label: string; hint: string }[] = [
  {
    value: "raw_text",
    label: "Raw text",
    hint: "Paste any text and we'll optimize it into a clean context pack.",
  },
  {
    value: "url_scrape",
    label: "Web page (URL)",
    hint: "We fetch the page and convert it to readable markdown.",
  },
  {
    value: "github",
    label: "GitHub file",
    hint: "Paste a github.com file URL (the /blob/ link) to fence the file.",
  },
];

const initialState: CreatePackState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Generating…" : "Generate context pack"}
    </button>
  );
}

export function CreateSourceForm() {
  const [state, formAction] = useActionState(createPack, initialState);
  const [sourceType, setSourceType] = useState<SourceType>("raw_text");
  const selected =
    SOURCE_OPTIONS.find((option) => option.value === sourceType) ??
    SOURCE_OPTIONS[0];

  const labelClass = "block text-sm font-medium";
  const fieldClass =
    "mt-1.5 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 dark:border-white/20";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error ? (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="title" className={labelClass}>
          Title <span className="text-foreground/40">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          placeholder="Leave blank to auto-generate"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="sourceType" className={labelClass}>
          Source type
        </label>
        <select
          id="sourceType"
          name="sourceType"
          value={sourceType}
          onChange={(event) => setSourceType(event.target.value as SourceType)}
          className={fieldClass}
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-foreground/50">{selected.hint}</p>
      </div>

      <div>
        <label htmlFor="source" className={labelClass}>
          {sourceType === "raw_text" ? "Text" : "URL"}
        </label>
        {sourceType === "raw_text" ? (
          <textarea
            id="source"
            name="source"
            rows={10}
            placeholder="Paste your text here…"
            className={`${fieldClass} resize-y font-mono`}
          />
        ) : (
          <input
            id="source"
            name="source"
            type="url"
            placeholder="https://…"
            className={fieldClass}
          />
        )}
      </div>

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
