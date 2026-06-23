// Validate supabase/migrations/0001_init.sql WITHOUT Docker or a cloud project.
//
// Runs the migration unmodified against PGlite (PostgreSQL compiled to WASM),
// behind a minimal `auth` schema shim that mirrors what Supabase provides at
// runtime. Proves the tables, RLS policies, CHECK constraints, and the
// handle_new_user signup trigger are all valid. Run with: npm run db:validate
//
// This is a developer/CI check only — it never touches a real database.

import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationPath = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "0001_init.sql",
);

const EXPECTED_TABLES = ["profiles", "data_sources", "context_packs"];
const EXPECTED_POLICY_COUNT = 11;

let failures = 0;
const pass = (msg) => console.log(`\u2713 ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.error(`\u2717 ${msg}`);
};

const db = new PGlite();

// Supabase ships an `auth` schema (auth.users + auth.uid()); a bare Postgres
// does not. Shim it so the real migration runs unmodified.
await db.exec(`
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text
  );
  create or replace function auth.uid() returns uuid language sql stable as $$
    select null::uuid;
  $$;
`);

let sql = await readFile(migrationPath, "utf8");

// uuid-ossp is preinstalled on Supabase but not bundled in PGlite. Provide
// uuid_generate_v4() via core gen_random_uuid() and neutralise the extension
// line for this embedded run only (the migration file on disk is untouched).
let uuidShimmed = false;
if (sql.includes('create extension if not exists "uuid-ossp"')) {
  await db.exec(`
    create or replace function uuid_generate_v4() returns uuid language sql as $$
      select gen_random_uuid();
    $$;
  `);
  sql = sql.replace(
    'create extension if not exists "uuid-ossp";',
    "-- (uuid-ossp shimmed for embedded validation)",
  );
  uuidShimmed = true;
}

try {
  await db.exec(sql);
  pass(`migration executed cleanly${uuidShimmed ? " (uuid-ossp shimmed)" : ""}`);
} catch (err) {
  fail(`migration failed to execute: ${err.message}`);
  await db.close();
  process.exit(1);
}

// 1. Tables exist.
for (const t of EXPECTED_TABLES) {
  const res = await db.query("select to_regclass($1) as oid", [`public.${t}`]);
  if (res.rows[0].oid) pass(`table public.${t} created`);
  else fail(`table public.${t} missing`);
}

// 2. RLS enabled on every table.
const rls = await db.query(
  `select relname from pg_class
     where relnamespace = 'public'::regnamespace
       and relrowsecurity = true
       and relname in ('profiles', 'data_sources', 'context_packs')`,
);
if (rls.rows.length === EXPECTED_TABLES.length) pass("RLS enabled on all tables");
else fail(`RLS not enabled on all tables (${rls.rows.length}/${EXPECTED_TABLES.length})`);

// 3. Expected number of RLS policies.
const pol = await db.query(
  "select count(*)::int as n from pg_policies where schemaname = 'public'",
);
if (pol.rows[0].n === EXPECTED_POLICY_COUNT) pass(`${pol.rows[0].n} RLS policies created`);
else fail(`expected ${EXPECTED_POLICY_COUNT} policies, got ${pol.rows[0].n}`);

// 4. Signup trigger auto-provisions a profile, and CHECK rejects bad source_type.
try {
  const uid = (
    await db.query("insert into auth.users (email) values ('a@b.c') returning id")
  ).rows[0].id;

  const prof = await db.query("select id from public.profiles where id = $1", [uid]);
  if (prof.rows.length === 1) pass("handle_new_user trigger auto-created profile on signup");
  else fail("handle_new_user trigger did not create a profile row");

  try {
    await db.query(
      "insert into public.data_sources (user_id, source_type, source_uri) values ($1, 'invalid_type', 'x')",
      [uid],
    );
    fail("source_type CHECK constraint did NOT reject an invalid value");
  } catch (err) {
    if (/source_type|check/i.test(err.message)) pass("source_type CHECK constraint rejects invalid values");
    else fail(`unexpected error testing CHECK constraint: ${err.message}`);
  }
} catch (err) {
  fail(`trigger/constraint checks errored: ${err.message}`);
}

await db.close();

if (failures > 0) {
  console.error(`\nSchema validation FAILED (${failures} problem(s)).`);
  process.exit(1);
}
console.log("\nSchema validation PASSED \u2014 0001_init.sql is valid.");
