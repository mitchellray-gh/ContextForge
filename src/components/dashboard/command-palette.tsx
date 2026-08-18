"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface PalettePack {
  id: string;
  title: string;
}

interface CommandPaletteProps {
  packs: PalettePack[];
}

type Command = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

/**
 * A minimal ⌘K / Ctrl-K command palette: the whole navigation model. Create a
 * pack, jump to any pack, or return to the dashboard — keyboard-first, no chrome.
 */
export function CommandPalette({ packs }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      {
        id: "new",
        label: "Create a new context pack",
        hint: "New",
        run: () => router.push("/dashboard/create"),
      },
      {
        id: "home",
        label: "Go to dashboard",
        hint: "Home",
        run: () => router.push("/dashboard"),
      },
    ];
    const packCommands: Command[] = packs.map((pack) => ({
      id: `pack-${pack.id}`,
      label: pack.title,
      hint: "Pack",
      run: () => router.push(`/dashboard/pack/${pack.id}`),
    }));
    return [...base, ...packCommands];
  }, [packs, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) =>
      command.label.toLowerCase().includes(q),
    );
  }, [commands, query]);

  function choose(index: number) {
    const command = filtered[index];
    if (!command) return;
    setOpen(false);
    command.run();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-panel shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((a) => Math.min(a + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              choose(active);
            }
          }}
          placeholder="Search packs or run a command…"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm outline-none"
        />
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">No matches</li>
          ) : (
            filtered.map((command, index) => (
              <li key={command.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                    index === active ? "bg-foreground/5" : ""
                  }`}
                >
                  <span className="truncate">{command.label}</span>
                  {command.hint ? (
                    <span className="ml-3 shrink-0 rounded border border-border px-1.5 py-0.5 text-xs text-muted">
                      {command.hint}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
