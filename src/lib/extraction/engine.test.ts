import { describe, it, expect, vi } from "vitest";

import { extract } from "@/lib/extraction/engine";

/** Builds a minimal mock of the global `fetch` returning the given text body. */
function mockFetch(body: string, ok = true, status = 200): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status,
    text: async () => body,
  })) as unknown as typeof fetch;
}

describe("extract", () => {
  it("formats raw text without performing any network request", async () => {
    const fetchFn = mockFetch("");
    const result = await extract(
      { sourceType: "raw_text", sourceUri: "hello world" },
      { fetchFn },
    );

    expect(result.content).toContain("hello world");
    expect(result.tokenCount).toBeGreaterThan(0);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("fetches a github file via the raw URL and fences it", async () => {
    const fetchFn = mockFetch("const x = 1\n");
    const result = await extract(
      {
        sourceType: "github",
        sourceUri: "https://github.com/o/r/blob/main/a.ts",
      },
      { fetchFn },
    );

    expect(fetchFn).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/o/r/main/a.ts",
    );
    expect(result.content).toContain("```typescript");
    expect(result.content).toContain("const x = 1");
    expect(result.title).toBe("a.ts");
  });

  it("scrapes a URL and strips dangerous markup", async () => {
    const fetchFn = mockFetch("<h1>Hi</h1><script>bad()</script>");
    const result = await extract(
      { sourceType: "url_scrape", sourceUri: "https://x.com" },
      { fetchFn },
    );

    expect(result.content).toContain("# Hi");
    expect(result.content).not.toContain("bad()");
  });

  it("honors an explicit title from metadata", async () => {
    const result = await extract({
      sourceType: "raw_text",
      sourceUri: "hello",
      metadata: { title: "Custom" },
    });
    expect(result.title).toBe("Custom");
  });

  it("rejects unsupported notion sources", async () => {
    await expect(
      extract({ sourceType: "notion", sourceUri: "x" }),
    ).rejects.toThrow(/notion/i);
  });

  it("throws when a fetch fails", async () => {
    const fetchFn = mockFetch("nope", false, 404);
    await expect(
      extract(
        { sourceType: "url_scrape", sourceUri: "https://x.com" },
        { fetchFn },
      ),
    ).rejects.toThrow(/404/);
  });
});
