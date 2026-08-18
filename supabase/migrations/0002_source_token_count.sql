-- 0002_source_token_count.sql
-- Adds the raw (pre-optimization) token count so the UI can show the
-- "raw → optimized" savings delta that is ContextForge's core value signal.
--
-- Backwards compatible: the column is nullable and defaults to NULL, so existing
-- packs and existing queries continue to work unchanged.

alter table context_packs
  add column if not exists source_token_count integer;
