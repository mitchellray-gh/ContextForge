import { describe, it, expect } from "vitest";

import {
  basename,
  formatGitHubFile,
  formatRawText,
  formatScrapedUrl,
  inferLanguage,
  inferTitle,
  toRawGitHubUrl,
} from "@/lib/extraction/sources";

describe("inferLanguage", () => {
  it("maps file extensions to fenced-code languages", () => {
    expect(inferLanguage("src/app.ts")).toBe("typescript");
    expect(inferLanguage("a.PY")).toBe("python");
    expect(inferLanguage("style.css")).toBe("css");
  });

  it("returns an empty string for unknown or missing extensions", () => {
    expect(inferLanguage("Makefile")).toBe("");
    expect(inferLanguage("noext")).toBe("");
  });
});

describe("toRawGitHubUrl", () => {
  it("rewrites github blob URLs to raw.githubusercontent.com", () => {
    expect(toRawGitHubUrl("https://github.com/o/r/blob/main/src/a.ts")).toBe(
      "https://raw.githubusercontent.com/o/r/main/src/a.ts",
    );
  });

  it("leaves non-blob URLs unchanged", () => {
    expect(toRawGitHubUrl("https://example.com/a.ts")).toBe(
      "https://example.com/a.ts",
    );
  });
});

describe("basename", () => {
  it("extracts the final path segment", () => {
    expect(basename("https://github.com/o/r/blob/main/src/a.ts")).toBe("a.ts");
  });
});

describe("formatGitHubFile", () => {
  it("wraps content in a fenced code block with inferred language and heading", () => {
    const out = formatGitHubFile(
      "https://github.com/o/r/blob/main/a.ts",
      "const x = 1\n",
    );
    expect(out).toContain("# a.ts");
    expect(out).toContain("```typescript");
    expect(out).toContain("const x = 1");
  });
});

describe("formatRawText", () => {
  it("optimizes whitespace", () => {
    expect(formatRawText("  hi\n\n\n\nthere  ")).toBe("hi\n\nthere");
  });
});

describe("formatScrapedUrl", () => {
  it("converts HTML to markdown and includes the source", () => {
    const out = formatScrapedUrl("https://x.com", "<h1>Hi</h1>");
    expect(out).toContain("# Hi");
    expect(out).toContain("Source: https://x.com");
  });
});

describe("inferTitle", () => {
  it("prefers an explicit metadata.title", () => {
    expect(
      inferTitle({
        sourceType: "raw_text",
        sourceUri: "anything",
        metadata: { title: "My Title" },
      }),
    ).toBe("My Title");
  });

  it("uses the filename for github sources", () => {
    expect(
      inferTitle({
        sourceType: "github",
        sourceUri: "https://github.com/o/r/blob/main/a.ts",
      }),
    ).toBe("a.ts");
  });

  it("uses the hostname for url_scrape sources", () => {
    expect(
      inferTitle({ sourceType: "url_scrape", sourceUri: "https://x.com/page" }),
    ).toBe("x.com");
  });

  it("uses the first non-empty line for raw text", () => {
    expect(
      inferTitle(
        { sourceType: "raw_text", sourceUri: "" },
        "\n\nFirst line\nSecond line",
      ),
    ).toBe("First line");
  });
});
