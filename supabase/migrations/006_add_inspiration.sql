-- Migration: Add inspiration column to card_designs

ALTER TABLE card_designs 
ADD COLUMN IF NOT EXISTS inspiration TEXT;

COMMENT ON COLUMN card_designs.inspiration IS 'What inspired this card - meme references, ideas, etc.';

