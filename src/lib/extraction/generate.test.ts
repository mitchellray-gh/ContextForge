import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import { generatePackFromSource } from "@/lib/extraction/generate";
import type { Database } from "@/types/database.types";

type DataSourceRow = {
  id: string;
  source_type: string;
  source_uri: string;
  metadata: unknown;
};

/**
 * Hand-rolled mock of the slice of the Supabase fluent API that
 * `generatePackFromSource` uses: a `data_sources` select/eq/eq/single read and a
 * `context_packs` insert/select/single write. Records the inserted payload.
 */
function makeFakeSupabase(source: DataSourceRow | null, insertedId: string) {
  const captured: { inserted?: Record<string, unknown> } = {};

  const client = {
    from(table: string) {
      if (table === "data_sources") {
        const builder = {
          select: () => builder,
          eq: () => builder,
          single: async () => ({
            data: source,
            error: source ? null : { message: "not found" },
          }),
        };
        return builder;
      }
      // context_packs
      return {
        insert(payload: Record<string, unknown>) {
          captured.inserted = payload;
          const builder = {
            select: () => builder,
            single: async () => ({ data: { id: insertedId }, error: null }),
          };
          return builder;
        },
      };
    },
  };

  return {
    client: client as unknown as SupabaseClient<Database>,
    captured,
  };
}

describe("generatePackFromSource", () => {
  it("extracts a raw_text source and inserts a context pack", async () => {
    const { client, captured } = makeFakeSupabase(
      {
        id: "src-1",
        source_type: "raw_text",
        source_uri: "hello world",
        metadata: { title: "Greeting" },
      },
      "pack-1",
    );

    const result = await generatePackFromSource(client, {
      sourceId: "src-1",
      userId: "user-1",
    });

    expect(result.packId).toBe("pack-1");
    expect(result.title).toBe("Greeting");
    expect(result.tokenCount).toBeGreaterThan(0);

    expect(captured.inserted).toMatchObject({
      user_id: "user-1",
      source_id: "src-1",
      title: "Greeting",
    });
    expect(String(captured.inserted?.raw_content)).toContain("hello world");
  });

  it("throws when the data source cannot be found", async () => {
    const { client } = makeFakeSupabase(null, "pack-x");
    await expect(
      generatePackFromSource(client, { sourceId: "missing", userId: "user-1" }),
    ).rejects.toThrow(/not found/i);
  });
});
