-- ============================================
-- MIGRATION: Fix deck_cards RLS for game rooms
-- ============================================
-- Allow players to view opponent's deck cards during active games
-- ============================================

-- Add policy to allow viewing deck cards for decks used in game rooms
-- where the current user is a participant
CREATE POLICY "Players can view opponent deck cards in games" ON deck_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_rooms gr
            WHERE gr.status IN ('waiting', 'mulligan', 'playing')
            AND (
                gr.player1_deck_id = deck_cards.deck_id
                OR gr.player2_deck_id = deck_cards.deck_id
            )
            AND (
                gr.player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
                OR gr.player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
            )
        )
    );

-- Also add a policy to allow viewing decks used in active game rooms
-- First check if policy exists and drop if needed
DROP POLICY IF EXISTS "Players can view opponent decks in games" ON decks;

CREATE POLICY "Players can view opponent decks in games" ON decks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM game_rooms gr
            WHERE gr.status IN ('waiting', 'mulligan', 'playing')
            AND (
                gr.player1_deck_id = decks.id
                OR gr.player2_deck_id = decks.id
            )
            AND (
                gr.player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
                OR gr.player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
            )
        )
    );

-- Ensure card_instances can be viewed during games (for opponent's cards)
DROP POLICY IF EXISTS "Players can view opponent card instances in games" ON card_instances;

CREATE POLICY "Players can view opponent card instances in games" ON card_instances
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deck_cards dc
            JOIN game_rooms gr ON (
                gr.player1_deck_id = dc.deck_id
                OR gr.player2_deck_id = dc.deck_id
            )
            WHERE dc.card_instance_id = card_instances.id
            AND gr.status IN ('waiting', 'mulligan', 'playing')
            AND (
                gr.player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
                OR gr.player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
            )
        )
    );

