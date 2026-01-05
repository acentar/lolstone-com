-- Add token keywords support to card designs
ALTER TABLE card_designs
ADD COLUMN IF NOT EXISTS token_keywords TEXT[]; -- Array of keywords for tokens

COMMENT ON COLUMN card_designs.token_keywords IS 'Keywords that tokens summoned by this card have (e.g., frontline, quick)';
