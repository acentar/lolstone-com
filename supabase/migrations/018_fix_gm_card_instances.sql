-- Migration: Give Game Masters full access to card_instances
-- This allows GMs to view all minted cards and give them to players

-- Allow GMs to view all card instances
DROP POLICY IF EXISTS "GMs can view all card instances" ON card_instances;
CREATE POLICY "GMs can view all card instances" ON card_instances
    FOR SELECT USING (is_game_master(auth.uid()));

-- Allow GMs to update card instances (for giving cards to players)
DROP POLICY IF EXISTS "GMs can update card instances" ON card_instances;
CREATE POLICY "GMs can update card instances" ON card_instances
    FOR UPDATE USING (is_game_master(auth.uid()));

-- Allow GMs to insert card instances (for minting)
DROP POLICY IF EXISTS "GMs can insert card instances" ON card_instances;
CREATE POLICY "GMs can insert card instances" ON card_instances
    FOR INSERT WITH CHECK (is_game_master(auth.uid()));

-- Allow GMs to delete card instances
DROP POLICY IF EXISTS "GMs can delete card instances" ON card_instances;
CREATE POLICY "GMs can delete card instances" ON card_instances
    FOR DELETE USING (is_game_master(auth.uid()));

-- Also ensure players can view their own cards
DROP POLICY IF EXISTS "Players can view own cards" ON card_instances;
CREATE POLICY "Players can view own cards" ON card_instances
    FOR SELECT USING (
        owner_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    );

