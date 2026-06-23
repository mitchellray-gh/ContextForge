import { htmlToMarkdown, optimizeMarkdown } from "./optimize";
import type { ExtractionInput } from "./types";

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cs: "csharp",
  php: "php",
  swift: "swift",
  scala: "scala",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  ps1: "powershell",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  html: "html",
  css: "css",
  scss: "scss",
  sql: "sql",
  md: "markdown",
  markdown: "markdown",
};

/** Returns a fenced-code language hint for a path/URL, or "" if unknown. */
export function inferLanguage(uri: string): string {
  const withoutQuery = uri.split(/[?#]/)[0];
  const ext = withoutQuery.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_BY_EXTENSION[ext] ?? "";
}

/** Rewrites a github.com `/blob/` URL to its raw.githubusercontent.com form. */
export function toRawGitHubUrl(uri: string): string {
  const match = uri.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i,
  );
  if (match) {
    return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`;
  }
  return uri;
}

/** Returns the final path segment of a URL/path. */
export function basename(uri: string): string {
  const clean = uri.split(/[?#]/)[0].replace(/\/+$/g, "");
  const parts = clean.split("/");
  return parts[parts.length - 1] || clean;
}

/** Wraps a fetched file in a titled, language-fenced markdown block. */
export function formatGitHubFile(uri: string, content: string): string {
  const language = inferLanguage(uri);
  const name = basename(uri);
  const fence = "```";
  return `# ${name}\n\nSource: ${uri}\n\n${fence}${language}\n${content.replace(
    /\n+$/g,
    "",
  )}\n${fence}`;
}

/** Optimizes user-provided raw text into a clean markdown block. */
export function formatRawText(text: string): string {
  return optimizeMarkdown(text);
}

/** Converts scraped HTML to markdown and prepends the source URL. */
export function formatScrapedUrl(uri: string, html: string): string {
  const body = htmlToMarkdown(html);
  return `Source: ${uri}\n\n${body}`;
}

/** Derives a human-friendly pack title from the input (and optional content). */
export function inferTitle(input: ExtractionInput, content?: string): string {
  const metaTitle = input.metadata?.["title"];
  if (typeof metaTitle === "string" && metaTitle.trim().length > 0) {
    return metaTitle.trim();
  }

  if (input.sourceType === "github") {
    return basename(input.sourceUri);
  }

  if (input.sourceType === "url_scrape") {
    try {
      return new URL(input.sourceUri).hostname;
    } catch {
      return "Web page";
    }
  }

  const firstLine = (content ?? input.sourceUri)
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return "Untitled pack";
  return firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
}
