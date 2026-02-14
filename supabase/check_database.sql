-- ============================================
-- LOLSTONE: Database diagnostic script
-- ============================================
-- Run this in Supabase Dashboard → SQL Editor
-- It checks if tables exist and RLS is set up so the app can work.
-- ============================================

-- 1) List all tables that the app expects
SELECT 'Tables check' AS step;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2) Required tables for auth + homepage + registration
SELECT 'Required tables present?' AS step;
SELECT
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_masters') AS game_masters,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'players') AS players,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'card_designs') AS card_designs,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'card_instances') AS card_instances,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'decks') AS decks;

-- 3) RLS enabled on key tables
SELECT 'RLS enabled on key tables?' AS step;
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN ('game_masters', 'players', 'card_designs', 'card_instances', 'decks')
ORDER BY c.relname;

-- 4) Policies on players (need SELECT for username check, INSERT for registration)
SELECT 'Policies on players' AS step;
SELECT policyname, cmd, qual::text AS using_expr
FROM pg_policies
WHERE tablename = 'players'
ORDER BY policyname;

-- 5) Policies on card_designs (need public SELECT for homepage)
SELECT 'Policies on card_designs' AS step;
SELECT policyname, cmd, roles, qual::text AS using_expr
FROM pg_policies
WHERE tablename = 'card_designs'
ORDER BY policyname;

-- 6) is_game_master function (required by RLS)
SELECT 'is_game_master function exists?' AS step;
SELECT EXISTS (
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'is_game_master'
) AS is_game_master_exists;

-- 7) Row counts (only run if step 2 shows all required tables = true)
SELECT 'Row counts' AS step;
SELECT
  (SELECT COUNT(*) FROM players) AS players_count,
  (SELECT COUNT(*) FROM card_designs) AS card_designs_count,
  (SELECT COUNT(*) FROM card_designs WHERE is_active = true AND total_minted > 0) AS minted_designs_count;
