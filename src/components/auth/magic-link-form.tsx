"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  signInWithMagicLink,
  type MagicLinkState,
} from "@/app/(auth)/login/actions";

const initialState: MagicLinkState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send magic link"}
    </button>
  );
}

export function MagicLinkForm() {
  const [state, formAction] = useActionState(signInWithMagicLink, initialState);

  if (state.success) {
    return (
      <div className="rounded-md bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
        Check your inbox for a sign-in link. You can close this tab once you
        click it.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-foreground/40 dark:border-white/20"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
