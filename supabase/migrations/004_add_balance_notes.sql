-- Migration: Add balance_notes column to card_designs
-- This field stores internal game master notes about card balance decisions

-- Add balance_notes column
ALTER TABLE card_designs 
ADD COLUMN IF NOT EXISTS balance_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN card_designs.balance_notes IS 'Internal notes for game masters about card balance decisions and design rationale';

