-- ============================================
-- LOLSTONE: Complete Database Schema
-- ============================================
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. GAME MASTERS TABLE
-- ============================================
-- Separate from regular players for security
CREATE TABLE game_masters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PLAYERS TABLE
-- ============================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    ducats INTEGER DEFAULT 0 CHECK (ducats >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast username lookups
CREATE INDEX idx_players_username ON players(username);

-- ============================================
-- 3. CARD DESIGNS TABLE (Templates)
-- ============================================
-- These are the card blueprints that can be minted
CREATE TYPE card_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE card_type AS ENUM ('meme_minion', 'viral_spell', 'troll_legendary', 'reaction_trap', 'copypasta_enchantment');

CREATE TABLE card_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    ability_text TEXT,
    flavor_text TEXT,
    
    -- Stats
    mana_cost INTEGER NOT NULL CHECK (mana_cost >= 0 AND mana_cost <= 10),
    attack INTEGER CHECK (attack >= 0),
    health INTEGER CHECK (health >= 0),
    
    -- Classification
    rarity card_rarity NOT NULL DEFAULT 'common',
    card_type card_type NOT NULL DEFAULT 'meme_minion',
    
    -- Artwork
    image_url TEXT,
    
    -- Minting info
    max_supply INTEGER, -- NULL means unlimited
    total_minted INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID REFERENCES game_masters(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true -- Can be disabled but not deleted
);

-- ============================================
-- 4. CARD INSTANCES TABLE (Minted Cards)
-- ============================================
-- Each row is a unique, permanent card instance
CREATE TABLE card_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    design_id UUID REFERENCES card_designs(id) ON DELETE RESTRICT NOT NULL,
    
    -- Ownership
    owner_id UUID REFERENCES players(id) ON DELETE SET NULL, -- NULL = unowned/in pool
    
    -- Edition & Serial
    edition INTEGER NOT NULL DEFAULT 1, -- 1 = First Edition, 2 = Second, etc.
    serial_number INTEGER NOT NULL, -- #47 out of 100
    edition_size INTEGER NOT NULL, -- Total in this edition batch
    
    -- Immutable timestamp
    minted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    minted_by UUID REFERENCES game_masters(id),
    
    -- Marketplace
    is_listed BOOLEAN DEFAULT false,
    list_price INTEGER CHECK (list_price > 0),
    listed_at TIMESTAMPTZ,
    
    -- Ensure serial numbers are unique per design per edition
    UNIQUE(design_id, edition, serial_number)
);

-- Indexes for common queries
CREATE INDEX idx_card_instances_owner ON card_instances(owner_id);
CREATE INDEX idx_card_instances_design ON card_instances(design_id);
CREATE INDEX idx_card_instances_listed ON card_instances(is_listed) WHERE is_listed = true;

-- ============================================
-- 5. TRANSACTIONS TABLE
-- ============================================
CREATE TYPE transaction_type AS ENUM (
    'mint',           -- GM minted cards
    'grant_ducats',   -- GM granted ducats
    'purchase',       -- Marketplace purchase
    'reward',         -- System reward
    'trade'           -- Player-to-player trade
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type transaction_type NOT NULL,
    
    -- Parties involved
    from_player_id UUID REFERENCES players(id),
    to_player_id UUID REFERENCES players(id),
    game_master_id UUID REFERENCES game_masters(id),
    
    -- What was exchanged
    card_instance_id UUID REFERENCES card_instances(id),
    ducats_amount INTEGER,
    
    -- Metadata
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_from ON transactions(from_player_id);
CREATE INDEX idx_transactions_to ON transactions(to_player_id);
CREATE INDEX idx_transactions_card ON transactions(card_instance_id);

-- ============================================
-- 6. PLAYER DECKS TABLE
-- ============================================
CREATE TABLE decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false, -- Currently selected deck
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE deck_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
    card_instance_id UUID REFERENCES card_instances(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(deck_id, card_instance_id)
);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to check if a user is a Game Master
CREATE OR REPLACE FUNCTION is_game_master(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM game_masters WHERE user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current edition for a card design
CREATE OR REPLACE FUNCTION get_current_edition(design_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    current_ed INTEGER;
BEGIN
    SELECT COALESCE(MAX(edition), 0) INTO current_ed
    FROM card_instances
    WHERE design_id = design_uuid;
    RETURN current_ed;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE game_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;

-- GAME MASTERS: Only GMs can see/modify GM data
CREATE POLICY "GMs can view all GMs" ON game_masters
    FOR SELECT USING (is_game_master(auth.uid()));

CREATE POLICY "GMs can insert GMs" ON game_masters
    FOR INSERT WITH CHECK (is_game_master(auth.uid()));

-- PLAYERS: GMs have full access, players can view all and update own
CREATE POLICY "Anyone can view players" ON players
    FOR SELECT USING (true);

CREATE POLICY "GMs can manage players" ON players
    FOR ALL USING (is_game_master(auth.uid()));

CREATE POLICY "Players can update own profile" ON players
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- CARD DESIGNS: Anyone can view, only GMs can create/modify
CREATE POLICY "Anyone can view card designs" ON card_designs
    FOR SELECT USING (true);

CREATE POLICY "GMs can manage card designs" ON card_designs
    FOR ALL USING (is_game_master(auth.uid()));

-- CARD INSTANCES: Anyone can view, GMs can create, owners can update listing
CREATE POLICY "Anyone can view card instances" ON card_instances
    FOR SELECT USING (true);

CREATE POLICY "GMs can create card instances" ON card_instances
    FOR INSERT WITH CHECK (is_game_master(auth.uid()));

CREATE POLICY "GMs can update card instances" ON card_instances
    FOR UPDATE USING (is_game_master(auth.uid()));

CREATE POLICY "Owners can list their cards" ON card_instances
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = card_instances.owner_id 
            AND players.user_id = auth.uid()
        )
    );

-- TRANSACTIONS: GMs see all, players see their own
CREATE POLICY "GMs can view all transactions" ON transactions
    FOR SELECT USING (is_game_master(auth.uid()));

CREATE POLICY "Players can view own transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.user_id = auth.uid() 
            AND (players.id = from_player_id OR players.id = to_player_id)
        )
    );

CREATE POLICY "GMs can create transactions" ON transactions
    FOR INSERT WITH CHECK (is_game_master(auth.uid()));

-- DECKS: Players manage their own, GMs can view all
CREATE POLICY "Players can manage own decks" ON decks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM players 
            WHERE players.id = decks.player_id 
            AND players.user_id = auth.uid()
        )
    );

CREATE POLICY "GMs can view all decks" ON decks
    FOR SELECT USING (is_game_master(auth.uid()));

CREATE POLICY "Players can manage own deck cards" ON deck_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM decks 
            JOIN players ON players.id = decks.player_id
            WHERE decks.id = deck_cards.deck_id 
            AND players.user_id = auth.uid()
        )
    );

-- ============================================
-- 9. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_masters_updated_at
    BEFORE UPDATE ON game_masters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_card_designs_updated_at
    BEFORE UPDATE ON card_designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_decks_updated_at
    BEFORE UPDATE ON decks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 10. INITIAL SEED: Create first Game Master
-- ============================================
-- After running this schema, create your first GM:
-- 1. Sign up via Supabase Auth (or create user in dashboard)
-- 2. Run this (replace with your user's UUID):
--
-- INSERT INTO game_masters (user_id, name, email)
-- VALUES ('your-auth-user-uuid', 'Your Name', 'your@email.com');

