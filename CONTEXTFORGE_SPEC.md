# ContextForge: System Architecture & Vibe-Coding Specification

> **Source of truth.** This file is the canonical, combined specification for
> ContextForge (merged from the original architecture notes + the Section 4
> directory layout). All build work must conform to the constraints below.

## 1. AI Agent Directives (Vibe Coding Rules)

As the AI coding assistant building ContextForge, you must strictly adhere to these rules:

*   **No Hallucinations:** Use only the approved tech stack. Do not introduce new libraries (like Framer Motion, Redux, or Chakra UI) unless explicitly authorized by the human director.
*   **Test-Driven Execution:** For all data-parsing logic and Supabase database interactions, write the Jest/Vitest unit tests *before* implementing the logic.
*   **Server-First:** Default to React Server Components (RSC) and Next.js Server Actions. Only use `"use client"` when interactivity (hooks, state) is strictly required.
*   **Type Safety:** Strict TypeScript is mandatory. All database queries must use the generated Supabase types. Never use `any`.
*   **Scope Isolation:** Only edit files explicitly relevant to the user's current prompt. Do not attempt "global refactors."

## 2. Tech Stack & Infrastructure

*   **Framework:** Next.js 15+ (App Router)
*   **Database & Auth:** Supabase (PostgreSQL, Supabase Auth via GitHub/Google OAuth)
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui (Radix primitives)
*   **Icons:** Lucide React
*   **Context Protocol:** Official `@modelcontextprotocol/sdk` (for formatting text into AI-readable MCP formats)

## 3. Database Schema (Supabase PostgreSQL)

Initialize the database with the following structure. Enable Row Level Security (RLS) on all tables so users can only access their own data.

```sql
-- Table: users (Handled largely by Supabase Auth auth.users, but we need a profile table)
CREATE TABLE profiles (
 id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
 email TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: data_sources
-- Stores the connection strings or URLs users want to extract from.
CREATE TABLE data_sources (
 id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 user_id UUID REFERENCES profiles(id) NOT NULL,
 source_type TEXT NOT NULL CHECK (source_type IN ('github', 'notion', 'url_scrape', 'raw_text')),
 source_uri TEXT NOT NULL,
 metadata JSONB DEFAULT '{}'::jsonb,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table: context_packs
-- The final optimized markdown/JSON packs ready for LLMs.
CREATE TABLE context_packs (
 id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
 user_id UUID REFERENCES profiles(id) NOT NULL,
 source_id UUID REFERENCES data_sources(id) ON DELETE CASCADE,
 title TEXT NOT NULL,
 token_count INTEGER DEFAULT 0,
 raw_content TEXT NOT NULL, -- The optimized markdown string
 created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

## 4. Project Directory Layout

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts       # Supabase OAuth callback
│   ├── dashboard/
│   │   ├── page.tsx                # Lists user's Context Packs
│   │   ├── create/page.tsx         # Form to add a new data source
│   │   └── pack/[id]/page.tsx      # View/Edit/Copy specific Context Pack
│   ├── api/
│   │   └── generate-pack/route.ts  # Core extraction engine logic
│   ├── layout.tsx
│   └── page.tsx                    # Landing Page
├── components/
│   ├── ui/                         # shadcn components go here
│   └── dashboard/                  # Feature-specific components
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server-side client
│   └── utils.ts
└── types/
    └── database.types.ts           # Auto-generated Supabase types
```
