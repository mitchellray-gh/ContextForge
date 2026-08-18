import { countTokens } from "./tokenize";
import {
  formatGitHubFile,
  formatRawText,
  formatScrapedUrl,
  inferTitle,
  toRawGitHubUrl,
} from "./sources";
import type { ExtractionDeps, ExtractionInput, ExtractionResult } from "./types";

/** Hosts that must never be fetched — cloud metadata + loopback aliases. */
const BLOCKED_HOSTNAMES =
  /^(localhost|0\.0\.0\.0|169\.254\.169\.254|metadata\.google\.internal)$/i;

/**
 * Guards against Server-Side Request Forgery. Only http/https to a public host
 * is allowed; private, loopback, link-local, and cloud-metadata targets are
 * rejected before any network call is made.
 */
export function assertPublicUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported.");
  }

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.test(host)) {
    throw new Error("Refusing to fetch a private or metadata address.");
  }

  // Block obvious private / loopback / link-local IPv4 ranges.
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    const isPrivate =
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168);
    if (isPrivate) {
      throw new Error("Refusing to fetch a private address.");
    }
  }

  // Block IPv6 loopback / unique-local / link-local.
  if (host === "::1" || /^\[?(::1|fc00|fd|fe80)/i.test(host)) {
    throw new Error("Refusing to fetch a private address.");
  }

  return url;
}

const MAX_FETCH_BYTES = 5_000_000; // 5 MB ceiling to bound memory/cost.
const FETCH_TIMEOUT_MS = 15_000;

async function fetchText(url: string, fetchFn: typeof fetch): Promise<string> {
  assertPublicUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetchFn(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "ContextForge/1.0 (+https://context-forge.app)",
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch (${response.status}): ${url}`);
    }
    const text = await response.text();
    return text.length > MAX_FETCH_BYTES
      ? text.slice(0, MAX_FETCH_BYTES)
      : text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Core extraction engine. Turns a single data source into an optimized markdown
 * context pack plus token counts (raw source vs. optimized output). Network
 * access is injectable via `deps.fetchFn` so the parsing logic is fully
 * unit-testable.
 */
export async function extract(
  input: ExtractionInput,
  deps: ExtractionDeps = {},
): Promise<ExtractionResult> {
  const fetchFn = deps.fetchFn ?? globalThis.fetch;

  let content: string;
  let raw: string;
  switch (input.sourceType) {
    case "raw_text":
      raw = input.sourceUri;
      content = formatRawText(input.sourceUri);
      break;
    case "github": {
      const rawUrl = toRawGitHubUrl(input.sourceUri);
      const file = await fetchText(rawUrl, fetchFn);
      raw = file;
      content = formatGitHubFile(input.sourceUri, file);
      break;
    }
    case "url_scrape": {
      const html = await fetchText(input.sourceUri, fetchFn);
      raw = html;
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
    tokenCount: countTokens(content),
    sourceTokenCount: countTokens(raw),
  };
}
