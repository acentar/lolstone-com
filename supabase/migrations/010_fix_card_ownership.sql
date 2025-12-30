-- Migration: Fix card ownership for booster purchases
-- Players need to be able to claim unowned cards from the pool

-- Allow players to claim unowned cards (for booster purchases)
CREATE POLICY "Players can claim unowned cards" ON card_instances
    FOR UPDATE 
    USING (owner_id IS NULL)  -- Only unowned cards
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = card_instances.owner_id  -- New owner must be a valid player
            AND players.user_id = auth.uid()  -- And it must be themselves
        )
    );

-- Allow players to insert transactions (for purchase records)
DROP POLICY IF EXISTS "Players can insert transactions" ON transactions;
CREATE POLICY "Players can insert transactions" ON transactions
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.user_id = auth.uid() 
            AND (players.id = to_player_id OR players.id = from_player_id)
        )
    );

