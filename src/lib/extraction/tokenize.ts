/**
 * Token counting.
 *
 * Uses `gpt-tokenizer` (the o200k_base BPE shared by GPT-4o / GPT-4.1 / o-series,
 * and a close proxy for modern Claude/Gemini budgets) for an accurate count
 * rather than a character heuristic. A defensive fallback keeps the engine
 * resilient if encoding ever throws on pathological input.
 */
import { encode } from "gpt-tokenizer";

/** Rough fallback: the widely-cited ~4 characters per token approximation. */
function estimateByChars(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return Math.ceil(trimmed.length / 4);
}

/** Returns the exact BPE token count for `text` (o200k_base). */
export function countTokens(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  try {
    return encode(trimmed).length;
  } catch {
    return estimateByChars(trimmed);
  }
}

/**
 * Backwards-compatible alias. Older call sites import `estimateTokens`; it now
 * delegates to the accurate BPE counter.
 */
export function estimateTokens(text: string): number {
  return countTokens(text);
}

/** Formats a token delta as a human-readable "42,000 → 9,300 (-78%)" string. */
export function formatTokenDelta(before: number, after: number): string {
  const pct = before > 0 ? Math.round(((before - after) / before) * 100) : 0;
  const sign = pct >= 0 ? "-" : "+";
  return `${before.toLocaleString()} → ${after.toLocaleString()} (${sign}${Math.abs(pct)}%)`;
}

/**
 * Trims markdown to fit within `maxTokens` on a paragraph boundary, keeping the
 * most relevant leading content and appending a truncation note. Returns the
 * original text unchanged when it already fits.
 */
export function trimToBudget(text: string, maxTokens: number): string {
  if (maxTokens <= 0) return "";
  if (countTokens(text) <= maxTokens) return text;

  const paragraphs = text.split(/\n{2,}/);
  const kept: string[] = [];
  let total = 0;
  const note = "\n\n> _[Trimmed by ContextForge to fit the token budget.]_";
  const noteTokens = countTokens(note);
  const budget = Math.max(0, maxTokens - noteTokens);

  for (const para of paragraphs) {
    const cost = countTokens(para) + 1;
    if (total + cost > budget) break;
    kept.push(para);
    total += cost;
  }

  if (kept.length === 0) {
    // Even the first paragraph overflows — hard-slice on tokens.
    const words = text.split(/\s+/);
    const out: string[] = [];
    let t = 0;
    for (const w of words) {
      const c = countTokens(`${w} `);
      if (t + c > budget) break;
      out.push(w);
      t += c;
    }
    return `${out.join(" ")}${note}`;
  }

  return `${kept.join("\n\n")}${note}`;
}
