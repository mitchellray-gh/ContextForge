import { describe, it, expect } from "vitest";

import { estimateTokens } from "@/lib/extraction/tokenize";

describe("estimateTokens", () => {
  it("returns 0 for empty or whitespace-only input", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("   \n\t  ")).toBe(0);
  });

  it("approximates ~1 token per 4 characters (trimmed)", () => {
    expect(estimateTokens("hello world")).toBe(3); // 11 chars / 4 -> ceil = 3
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });

  it("is monotonic: more text yields at least as many tokens", () => {
    const short = estimateTokens("short text");
    const long = estimateTokens("short text".repeat(20));
    expect(long).toBeGreaterThan(short);
  });
});
