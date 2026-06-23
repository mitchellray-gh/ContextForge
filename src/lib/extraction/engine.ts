import { estimateTokens } from "./tokenize";
import {
  formatGitHubFile,
  formatRawText,
  formatScrapedUrl,
  inferTitle,
  toRawGitHubUrl,
} from "./sources";
import type { ExtractionDeps, ExtractionInput, ExtractionResult } from "./types";

async function fetchText(url: string, fetchFn: typeof fetch): Promise<string> {
  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch (${response.status}): ${url}`);
  }
  return response.text();
}

/**
 * Core extraction engine. Turns a single data source into an optimized markdown
 * context pack plus an estimated token count. Network access is injectable via
 * `deps.fetchFn` so the parsing logic is fully unit-testable.
 */
export async function extract(
  input: ExtractionInput,
  deps: ExtractionDeps = {},
): Promise<ExtractionResult> {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;

  let content: string;
  switch (input.sourceType) {
    case "raw_text":
      content = formatRawText(input.sourceUri);
      break;
    case "github": {
      const rawUrl = toRawGitHubUrl(input.sourceUri);
      const file = await fetchText(rawUrl, fetchFn);
      content = formatGitHubFile(input.sourceUri, file);
      break;
    }
    case "url_scrape": {
      const html = await fetchText(input.sourceUri, fetchFn);
      content = formatScrapedUrl(input.sourceUri, html);
      break;
    }
    case "notion":
      throw new Error("Notion sources are not supported yet.");
    default:
      throw new Error(`Unsupported source type: ${String(input.sourceType)}`);
  }

  return {
    title: inferTitle(input, content),
    content,
    tokenCount: estimateTokens(content),
  };
}
