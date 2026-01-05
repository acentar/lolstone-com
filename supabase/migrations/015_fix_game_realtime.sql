-- ============================================
-- MIGRATION: Fix Game Realtime Sync
-- ============================================
-- Ensures realtime is properly set up for game_rooms
-- ============================================

-- Add updated_at column if it doesn't exist
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to update updated_at on any change
CREATE OR REPLACE FUNCTION update_game_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_game_rooms_updated_at ON game_rooms;
CREATE TRIGGER trigger_game_rooms_updated_at
    BEFORE UPDATE ON game_rooms
    FOR EACH ROW EXECUTE FUNCTION update_game_rooms_updated_at();

-- CRITICAL: Set REPLICA IDENTITY FULL so realtime sends the complete row
-- This is required for Supabase Realtime to work properly with UPDATE events
ALTER TABLE game_rooms REPLICA IDENTITY FULL;

-- Also ensure the INSERT policy exists for game_rooms (needed for creating games)
DROP POLICY IF EXISTS "System can create game rooms" ON game_rooms;
CREATE POLICY "System can create game rooms" ON game_rooms
    FOR INSERT WITH CHECK (true);

