/**
 * ContextForge database types.
 *
 * Hand-authored to match CONTEXTFORGE_SPEC.md §3 and the shape produced by the
 * Supabase CLI type generator. Once your Supabase project is live, REGENERATE
 * this file (do not edit by hand) so it stays in sync with the real database:
 *
 *   # against a linked remote project:
 *   npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/types/database.types.ts
 *
 *   # or against a local `supabase start` stack:
 *   npx supabase gen types typescript --local --schema public > src/types/database.types.ts
 *
 * Note: `source_type` is a CHECK constraint in the database, so the generator
 * emits it as `string` (allowed values: 'github' | 'notion' | 'url_scrape' |
 * 'raw_text'). Do not narrow it here, or it will drift from the generated file.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      data_sources: {
        Row: {
          id: string;
          user_id: string;
          source_type: string;
          source_uri: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: string;
          source_uri: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_type?: string;
          source_uri?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "data_sources_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      context_packs: {
        Row: {
          id: string;
          user_id: string;
          source_id: string | null;
          title: string;
          token_count: number | null;
          raw_content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_id?: string | null;
          title: string;
          token_count?: number | null;
          raw_content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_id?: string | null;
          title?: string;
          token_count?: number | null;
          raw_content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "context_packs_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "data_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "context_packs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T]["Row"];

export type TablesInsert<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<
  T extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][T]["Update"];
