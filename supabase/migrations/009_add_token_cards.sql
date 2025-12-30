-- Migration: Add token card support
-- Tokens are part of the main card design and can be summoned via effects

-- Add token-related columns to card_designs
ALTER TABLE card_designs
ADD COLUMN IF NOT EXISTS has_token BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS token_name TEXT,
ADD COLUMN IF NOT EXISTS token_image_url TEXT,
ADD COLUMN IF NOT EXISTS token_attack INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS token_health INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS token_trigger TEXT, -- 'on_play', 'on_destroy', 'on_attack', 'on_damaged'
ADD COLUMN IF NOT EXISTS token_count INTEGER DEFAULT 1, -- How many tokens to summon (for on_play/on_destroy)
ADD COLUMN IF NOT EXISTS token_max_summons INTEGER DEFAULT 1; -- Max times token can be summoned (for on_attack/on_damaged)

-- Add comment for clarity
COMMENT ON COLUMN card_designs.has_token IS 'Whether this card can summon a token';
COMMENT ON COLUMN card_designs.token_name IS 'Name of the token unit';
COMMENT ON COLUMN card_designs.token_image_url IS 'Image URL for the token';
COMMENT ON COLUMN card_designs.token_attack IS 'Token attack value';
COMMENT ON COLUMN card_designs.token_health IS 'Token health value';
COMMENT ON COLUMN card_designs.token_trigger IS 'When the token is summoned: on_play, on_destroy, on_attack, on_damaged';
COMMENT ON COLUMN card_designs.token_count IS 'Number of tokens to summon per trigger (for on_play/on_destroy)';
COMMENT ON COLUMN card_designs.token_max_summons IS 'Maximum total times tokens can be summoned (for on_attack/on_damaged)';

