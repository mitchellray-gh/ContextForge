/**
 * Token estimation.
 *
 * Uses the widely-cited "~4 characters per token" heuristic. This is an
 * approximation (not a true BPE tokenizer), which keeps the engine dependency-
 * free while giving users a reliable budgeting signal for `token_count`.
 */
export function estimateTokens(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return Math.ceil(trimmed.length / 4);
}
