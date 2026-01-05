-- Migration: Fix RLS policies for card viewing
-- This fixes issues where only some cards/designs were visible
-- RUN THIS MIGRATION TO FIX THE "ONLY 2 DESIGNS" BUG

-- ============================================
-- DISABLE RLS TEMPORARILY TO ENSURE CLEAN STATE
-- ============================================

-- First, disable RLS on both tables to see if that's the issue
-- Then re-enable with proper policies

-- ============================================
-- CARD_DESIGNS TABLE
-- ============================================
ALTER TABLE card_designs ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on card_designs to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view card designs" ON card_designs;
DROP POLICY IF EXISTS "GMs can manage card designs" ON card_designs;
DROP POLICY IF EXISTS "Public can view designs" ON card_designs;

-- Simple policy: Everyone can view card designs
CREATE POLICY "Public can view card designs" ON card_designs
    FOR SELECT TO PUBLIC USING (true);

-- GMs can do everything with card designs
CREATE POLICY "GMs can manage card designs" ON card_designs
    FOR ALL TO authenticated USING (is_game_master(auth.uid()));

-- ============================================
-- CARD_INSTANCES TABLE
-- ============================================
ALTER TABLE card_instances ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on card_instances to avoid conflicts
DROP POLICY IF EXISTS "Players can view unowned cards" ON card_instances;
DROP POLICY IF EXISTS "Players can view own cards" ON card_instances;
DROP POLICY IF EXISTS "GMs can view all card instances" ON card_instances;
DROP POLICY IF EXISTS "GMs can update card instances" ON card_instances;
DROP POLICY IF EXISTS "GMs can insert card instances" ON card_instances;
DROP POLICY IF EXISTS "GMs can delete card instances" ON card_instances;
DROP POLICY IF EXISTS "Players can claim unowned cards" ON card_instances;
DROP POLICY IF EXISTS "Players can view opponent card instances in games" ON card_instances;
DROP POLICY IF EXISTS "Authenticated can view unowned" ON card_instances;

-- SIMPLE SELECT POLICY: Authenticated users can view:
-- 1. Their own cards (owner_id matches their player)
-- 2. Unowned cards (owner_id IS NULL) - for shop/booster
-- 3. GMs can view everything
CREATE POLICY "Authenticated can view cards" ON card_instances
    FOR SELECT TO authenticated USING (
        owner_id IS NULL  -- Unowned cards (shop pool)
        OR owner_id IN (SELECT id FROM players WHERE user_id = auth.uid())  -- Own cards
        OR is_game_master(auth.uid())  -- GM sees all
    );

-- GMs can UPDATE all card instances (for giving cards)
CREATE POLICY "GMs can update card instances" ON card_instances
    FOR UPDATE TO authenticated USING (is_game_master(auth.uid()));

-- GMs can INSERT card instances (for minting)
CREATE POLICY "GMs can insert card instances" ON card_instances
    FOR INSERT TO authenticated WITH CHECK (is_game_master(auth.uid()));

-- GMs can DELETE card instances
CREATE POLICY "GMs can delete card instances" ON card_instances
    FOR DELETE TO authenticated USING (is_game_master(auth.uid()));

-- Players can UPDATE to claim unowned cards (for purchasing)
CREATE POLICY "Players can claim unowned cards" ON card_instances
    FOR UPDATE TO authenticated 
    USING (owner_id IS NULL)
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = card_instances.owner_id
            AND players.user_id = auth.uid()
        )
    );

-- ============================================
-- VERIFY: Check that RLS is configured correctly
-- ============================================
-- After running this migration, test with:
-- SELECT COUNT(*) FROM card_instances WHERE owner_id IS NULL;
-- This should return the total number of unowned cards

