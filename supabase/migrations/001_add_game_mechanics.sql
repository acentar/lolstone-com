-- ============================================
-- MIGRATION: Add Game Mechanics to Cards
-- ============================================
-- Run this in Supabase SQL Editor after the initial schema
-- ============================================

-- 1. Update card_type enum to match game rules (Unit vs Action)
-- First, let's add the new simplified types
-- Note: We keep the fun names but categorize them

-- Create a new enum for the primary card category
CREATE TYPE card_category AS ENUM ('unit', 'action');

-- Create keywords enum for unit abilities
CREATE TYPE card_keyword AS ENUM (
    'frontline',   -- Attacks must target this unit first
    'quick',       -- Can attack immediately (ignores summoning sickness)
    'evasion',     -- Cannot be targeted by actions
    'boost'        -- +1/+1 stackable buff
);

-- Create effect trigger types
CREATE TYPE effect_trigger AS ENUM (
    'on_play',     -- Triggers when card is played
    'on_destroy',  -- Triggers when unit is destroyed
    'on_attack',   -- Triggers when this unit attacks
    'on_damaged',  -- Triggers when this unit takes damage
    'end_of_turn', -- Triggers at end of your turn
    'start_of_turn' -- Triggers at start of your turn
);

-- Create effect target types
CREATE TYPE effect_target AS ENUM (
    'self',           -- This unit
    'friendly_unit',  -- A friendly unit
    'enemy_unit',     -- An enemy unit
    'any_unit',       -- Any unit on board
    'friendly_player', -- Your profile
    'enemy_player',   -- Enemy profile
    'all_friendly',   -- All friendly units
    'all_enemies',    -- All enemy units
    'all_units',      -- All units on board
    'random_enemy',   -- Random enemy unit
    'random_friendly' -- Random friendly unit
);

-- Create effect action types
CREATE TYPE effect_action AS ENUM (
    'damage',      -- Deal damage
    'heal',        -- Restore health
    'draw',        -- Draw cards
    'buff_attack', -- Increase attack
    'buff_health', -- Increase health
    'destroy',     -- Destroy target
    'summon',      -- Summon a unit
    'silence',     -- Remove all effects/keywords
    'return_hand', -- Return to hand
    'copy'         -- Create a copy
);

-- 2. Create effects table for card effects (more flexible than JSON)
CREATE TABLE card_effects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_design_id UUID REFERENCES card_designs(id) ON DELETE CASCADE NOT NULL,
    
    -- When does this effect trigger?
    trigger effect_trigger NOT NULL,
    
    -- What does it target?
    target effect_target NOT NULL,
    
    -- What action does it perform?
    action effect_action NOT NULL,
    
    -- Value (damage amount, heal amount, cards to draw, etc.)
    value INTEGER DEFAULT 0,
    
    -- Optional: reference to another card (for summon effects)
    summon_card_id UUID REFERENCES card_designs(id),
    
    -- Description override (for display)
    description TEXT,
    
    -- Order of execution (for multiple effects)
    priority INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_card_effects_design ON card_effects(card_design_id);

-- 3. Create keywords junction table (cards can have multiple keywords)
CREATE TABLE card_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_design_id UUID REFERENCES card_designs(id) ON DELETE CASCADE NOT NULL,
    keyword card_keyword NOT NULL,
    
    -- Ensure no duplicate keywords per card
    UNIQUE(card_design_id, keyword)
);

CREATE INDEX idx_card_keywords_design ON card_keywords(card_design_id);

-- 4. Add new columns to card_designs
ALTER TABLE card_designs 
ADD COLUMN IF NOT EXISTS category card_category DEFAULT 'unit',
ADD COLUMN IF NOT EXISTS base_attack INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_health INTEGER DEFAULT 0;

-- Migrate existing attack/health to base values
UPDATE card_designs SET base_attack = COALESCE(attack, 0), base_health = COALESCE(health, 0);

-- 5. Add RLS policies for new tables
ALTER TABLE card_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_keywords ENABLE ROW LEVEL SECURITY;

-- Anyone can view effects and keywords
CREATE POLICY "Anyone can view card effects" ON card_effects
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view card keywords" ON card_keywords
    FOR SELECT USING (true);

-- Only GMs can manage effects and keywords
CREATE POLICY "GMs can manage card effects" ON card_effects
    FOR ALL USING (is_game_master(auth.uid()));

CREATE POLICY "GMs can manage card keywords" ON card_keywords
    FOR ALL USING (is_game_master(auth.uid()));

-- 6. Create a view for full card data (design + effects + keywords)
CREATE OR REPLACE VIEW card_designs_full AS
SELECT 
    cd.*,
    COALESCE(
        (SELECT array_agg(ck.keyword) FROM card_keywords ck WHERE ck.card_design_id = cd.id),
        ARRAY[]::card_keyword[]
    ) as keywords,
    COALESCE(
        (SELECT json_agg(json_build_object(
            'id', ce.id,
            'trigger', ce.trigger,
            'target', ce.target,
            'action', ce.action,
            'value', ce.value,
            'description', ce.description
        ) ORDER BY ce.priority) FROM card_effects ce WHERE ce.card_design_id = cd.id),
        '[]'::json
    ) as effects
FROM card_designs cd;

-- ============================================
-- EXAMPLE CARDS (for testing)
-- ============================================
-- Uncomment and run after migration to create sample cards

/*
-- Example 1: Basic Unit with Frontline
INSERT INTO card_designs (name, ability_text, flavor_text, mana_cost, attack, health, rarity, card_type, category, base_attack, base_health)
VALUES ('Keyboard Warrior', 'Frontline', '"Caps lock is cruise control for cool"', 3, 2, 4, 'common', 'meme_minion', 'unit', 2, 4);

INSERT INTO card_keywords (card_design_id, keyword)
SELECT id, 'frontline' FROM card_designs WHERE name = 'Keyboard Warrior';

-- Example 2: Quick Unit
INSERT INTO card_designs (name, ability_text, flavor_text, mana_cost, attack, health, rarity, card_type, category, base_attack, base_health)
VALUES ('Speedrunner', 'Quick', '"Any% no glitches"', 2, 3, 1, 'rare', 'meme_minion', 'unit', 3, 1);

INSERT INTO card_keywords (card_design_id, keyword)
SELECT id, 'quick' FROM card_designs WHERE name = 'Speedrunner';

-- Example 3: Action Card (Deal Damage)
INSERT INTO card_designs (name, ability_text, flavor_text, mana_cost, rarity, card_type, category)
VALUES ('Ratio''d', 'Deal 3 damage to a unit', '"L + Ratio + You fell off"', 2, 'common', 'viral_spell', 'action');

INSERT INTO card_effects (card_design_id, trigger, target, action, value, description)
SELECT id, 'on_play', 'any_unit', 'damage', 3, 'Deal 3 damage' FROM card_designs WHERE name = 'Ratio''d';

-- Example 4: Unit with On Play Effect
INSERT INTO card_designs (name, ability_text, flavor_text, mana_cost, attack, health, rarity, card_type, category, base_attack, base_health)
VALUES ('Reply Guy', 'On Play: Deal 1 damage to the enemy player', '"Well actually..."', 1, 1, 1, 'common', 'meme_minion', 'unit', 1, 1);

INSERT INTO card_effects (card_design_id, trigger, target, action, value, description)
SELECT id, 'on_play', 'enemy_player', 'damage', 1, 'Deal 1 damage to enemy' FROM card_designs WHERE name = 'Reply Guy';

-- Example 5: Legendary with Evasion and On Destroy
INSERT INTO card_designs (name, ability_text, flavor_text, mana_cost, attack, health, rarity, card_type, category, base_attack, base_health)
VALUES ('Doge of Wall Street', 'Evasion. On Destroy: Draw 2 cards', '"Much profit. Very moon."', 5, 4, 3, 'legendary', 'troll_legendary', 'unit', 4, 3);

INSERT INTO card_keywords (card_design_id, keyword)
SELECT id, 'evasion' FROM card_designs WHERE name = 'Doge of Wall Street';

INSERT INTO card_effects (card_design_id, trigger, target, action, value, description)
SELECT id, 'on_destroy', 'friendly_player', 'draw', 2, 'Draw 2 cards' FROM card_designs WHERE name = 'Doge of Wall Street';
*/

-- 7. Create is_game_master RPC function for authentication
CREATE OR REPLACE FUNCTION is_game_master(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM game_masters
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_game_master(UUID) TO authenticated;

-- ============================================
-- After running this migration:
-- 1. Verify tables are created
-- 2. Enable Realtime in Supabase Dashboard for matchmaking
-- ============================================

