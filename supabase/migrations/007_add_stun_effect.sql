-- Migration: Add stun effect action
-- This adds the ability for cards to stun enemy units, preventing them from attacking next turn

-- Add 'stun' to the effect_action enum
ALTER TYPE effect_action ADD VALUE IF NOT EXISTS 'stun';

-- Note: After adding this migration, a card can have an effect like:
-- trigger: 'on_play'
-- action: 'stun' 
-- target: 'enemy_unit'
-- value: 1 (value is not used for stun, but could represent duration in future)
-- This will prevent the targeted enemy unit from attacking on their next turn.

