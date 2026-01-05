-- Add email column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);

