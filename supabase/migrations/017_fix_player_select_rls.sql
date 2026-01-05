-- Migration: Fix player SELECT RLS policy for registration
-- This allows username checks during registration (before user is fully authenticated)

-- Allow anyone to view basic player info (needed for username availability check)
-- This is safe because player profiles are public in the game context
DROP POLICY IF EXISTS "Anyone can view players" ON players;
CREATE POLICY "Anyone can view players" ON players
    FOR SELECT USING (true);

-- Keep the existing policies:
-- - "GMs can manage players" for ALL
-- - "Users can create own player profile" for INSERT
-- - "Players can update own profile" for UPDATE

-- Add a policy for users to update their own profile if it doesn't exist
DROP POLICY IF EXISTS "Players can update own profile" ON players;
CREATE POLICY "Players can update own profile" ON players
    FOR UPDATE USING (auth.uid() = user_id);

