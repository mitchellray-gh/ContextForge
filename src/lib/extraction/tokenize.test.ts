import { describe, it, expect } from "vitest";

import {
  countTokens,
  estimateTokens,
  formatTokenDelta,
} from "@/lib/extraction/tokenize";

describe("countTokens", () => {
  it("returns 0 for empty or whitespace-only input", () => {
    expect(countTokens("")).toBe(0);
    expect(countTokens("   \n\t  ")).toBe(0);
  });

  it("counts real BPE tokens (o200k_base)", () => {
    expect(countTokens("hello world")).toBeGreaterThan(0);
    expect(countTokens("hello world")).toBeLessThanOrEqual(4);
  });

  it("is monotonic: more text yields at least as many tokens", () => {
    const short = countTokens("short text");
    const long = countTokens("short text".repeat(20));
    expect(long).toBeGreaterThan(short);
  });

  it("estimateTokens is a backwards-compatible alias", () => {
    expect(estimateTokens("hello world")).toBe(countTokens("hello world"));
  });
});

describe("formatTokenDelta", () => {
  it("formats a reduction with a percentage", () => {
    expect(formatTokenDelta(42000, 9300)).toBe("42,000 → 9,300 (-78%)");
  });

  it("handles zero baseline safely", () => {
    expect(formatTokenDelta(0, 0)).toBe("0 → 0 (-0%)");
  });

  it("marks growth with a plus sign", () => {
    expect(formatTokenDelta(100, 150)).toBe("100 → 150 (+50%)");
  });
});
