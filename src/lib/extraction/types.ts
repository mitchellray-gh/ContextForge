/** Shared types for the ContextForge extraction engine. */

/** The source kinds defined by the database CHECK constraint (spec §3). */
export type SourceType = "github" | "notion" | "url_scrape" | "raw_text";

/** All supported source types, in display order. */
export const SOURCE_TYPES: readonly SourceType[] = [
  "raw_text",
  "url_scrape",
  "github",
  "notion",
];

/** Source types the engine can currently process end-to-end. */
export const SUPPORTED_SOURCE_TYPES: readonly SourceType[] = [
  "raw_text",
  "url_scrape",
  "github",
];

export interface ExtractionInput {
  sourceType: SourceType;
  /** A URL, a github blob/raw URL, or — for `raw_text` — the text itself. */
  sourceUri: string;
  /** Optional free-form metadata; `title` is honored when present. */
  metadata?: Record<string, unknown> | null;
}

export interface ExtractionResult {
  title: string;
  /** The optimized markdown context pack. */
  content: string;
  tokenCount: number;
}

export interface ExtractionDeps {
  /** Injectable fetch implementation (defaults to the global) for testing. */
  fetchFn?: typeof fetch;
}
