/**
 * Markdown/HTML optimization helpers.
 *
 * These are intentionally lightweight, regex-based transforms (no DOM parser
 * dependency). They cover the common cases needed to turn scraped HTML into
 * reasonable markdown and to tidy arbitrary text into a compact context pack.
 */

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&hellip;": "…",
  "&copy;": "©",
  "&reg;": "®",
};

export function decodeHtmlEntities(input: string): string {
  let out = input.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|copy|reg);/g,
    (match) => NAMED_ENTITIES[match] ?? match,
  );
  out = out.replace(/&#0*39;/g, "'");
  out = out.replace(/&#(\d+);/g, (_match, code: string) =>
    String.fromCodePoint(Number(code)),
  );
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_match, code: string) =>
    String.fromCodePoint(Number.parseInt(code, 16)),
  );
  return out;
}

/** Normalizes line endings, trims trailing whitespace, and collapses blank runs. */
export function optimizeMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Best-effort conversion of an HTML document fragment into markdown. */
export function htmlToMarkdown(html: string): string {
  let out = html;

  // Drop non-content blocks entirely.
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<head[\s\S]*?<\/head>/gi, "");

  // Headings.
  out = out.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_match, level: string, inner: string) =>
      `\n\n${"#".repeat(Number(level))} ${inner.trim()}\n\n`,
  );

  // Links.
  out = out.replace(
    /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_match, href: string, inner: string) => `[${inner.trim()}](${href})`,
  );

  // Inline emphasis.
  out = out.replace(
    /<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi,
    (_match, _tag: string, inner: string) => `**${inner.trim()}**`,
  );
  out = out.replace(
    /<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi,
    (_match, _tag: string, inner: string) => `*${inner.trim()}*`,
  );

  // List items.
  out = out.replace(
    /<li[^>]*>([\s\S]*?)<\/li>/gi,
    (_match, inner: string) => `\n- ${inner.trim()}`,
  );

  // Block boundaries -> blank lines.
  out = out.replace(/<br\s*\/?>(?!\n)/gi, "\n");
  out = out.replace(/<\/(p|div|section|article|ul|ol|tr|h[1-6])>/gi, "\n\n");

  // Strip any remaining tags, then decode entities.
  out = out.replace(/<[^>]+>/g, "");
  out = decodeHtmlEntities(out);

  return optimizeMarkdown(out);
}
