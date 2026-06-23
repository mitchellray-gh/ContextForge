import { describe, it, expect } from "vitest";

import {
  decodeHtmlEntities,
  htmlToMarkdown,
  optimizeMarkdown,
} from "@/lib/extraction/optimize";

describe("optimizeMarkdown", () => {
  it("collapses 3+ consecutive blank lines to a single blank line", () => {
    expect(optimizeMarkdown("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("strips trailing whitespace and trims the document", () => {
    expect(optimizeMarkdown("a   \nb")).toBe("a\nb");
    expect(optimizeMarkdown("\n\n  hi  \n\n")).toBe("hi");
  });

  it("normalizes CRLF line endings", () => {
    expect(optimizeMarkdown("a\r\nb")).toBe("a\nb");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes common named entities", () => {
    expect(decodeHtmlEntities("&amp;&lt;&gt;&quot;&#39;")).toBe("&<>\"'");
  });

  it("decodes numeric entities", () => {
    expect(decodeHtmlEntities("&#8212;")).toBe("—");
  });
});

describe("htmlToMarkdown", () => {
  it("converts headings", () => {
    expect(htmlToMarkdown("<h1>Hi</h1>")).toBe("# Hi");
    expect(htmlToMarkdown("<h2>Sub</h2>")).toBe("## Sub");
  });

  it("converts links, bold and italic", () => {
    expect(htmlToMarkdown('<a href="https://x.com">link</a>')).toBe(
      "[link](https://x.com)",
    );
    expect(htmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
    expect(htmlToMarkdown("<em>it</em>")).toBe("*it*");
  });

  it("converts list items", () => {
    expect(htmlToMarkdown("<ul><li>a</li><li>b</li></ul>")).toBe("- a\n- b");
  });

  it("removes script and style content entirely", () => {
    const out = htmlToMarkdown("<p>Hello</p><script>alert(1)</script>");
    expect(out).toBe("Hello");
    expect(out).not.toContain("alert");
  });

  it("decodes entities in the resulting text", () => {
    expect(htmlToMarkdown("<p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
  });
});
