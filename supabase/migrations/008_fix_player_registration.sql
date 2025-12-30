-- Migration: Fix player registration RLS policy
-- This allows new users to create their own player profile during registration

-- Drop the restrictive policy if it exists
DROP POLICY IF EXISTS "GMs can manage players" ON players;

-- Allow GMs to do everything with players
CREATE POLICY "GMs can manage players" ON players
    FOR ALL USING (is_game_master(auth.uid()));

-- Allow authenticated users to create their own player profile
-- This is essential for new user registration
CREATE POLICY "Users can create own player profile" ON players
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Note: The existing policies remain:
-- - "Anyone can view players" for SELECT
-- - "Players can update own profile" for UPDATE

