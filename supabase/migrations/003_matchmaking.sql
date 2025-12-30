-- ============================================
-- MIGRATION: Matchmaking & Game Rooms
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create game status enum
CREATE TYPE game_status AS ENUM (
    'waiting',      -- Waiting for players to connect
    'mulligan',     -- Card mulligan phase
    'playing',      -- Active gameplay
    'ended'         -- Game completed
);

-- 2. Create matchmaking queue table
CREATE TABLE matchmaking_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
    deck_id UUID REFERENCES decks(id) NOT NULL,
    
    -- Queue state
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    rating INTEGER DEFAULT 1000, -- For future ranked matching
    
    -- Ensure player can only be in queue once
    UNIQUE(player_id)
);

CREATE INDEX idx_matchmaking_queue_joined ON matchmaking_queue(joined_at);

-- 3. Create game rooms table
CREATE TABLE game_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Players
    player1_id UUID REFERENCES players(id) NOT NULL,
    player2_id UUID REFERENCES players(id) NOT NULL,
    
    -- Decks used
    player1_deck_id UUID REFERENCES decks(id) NOT NULL,
    player2_deck_id UUID REFERENCES decks(id) NOT NULL,
    
    -- Game state
    status game_status DEFAULT 'waiting' NOT NULL,
    current_turn INTEGER DEFAULT 0,
    active_player_id UUID REFERENCES players(id),
    winner_id UUID REFERENCES players(id),
    
    -- Game data (JSON blob for full state)
    game_state JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    
    -- Turn timing
    turn_started_at TIMESTAMPTZ,
    turn_time_limit INTEGER DEFAULT 90
);

CREATE INDEX idx_game_rooms_players ON game_rooms(player1_id, player2_id);
CREATE INDEX idx_game_rooms_status ON game_rooms(status) WHERE status != 'ended';

-- 4. Game actions log (for replay and debugging)
CREATE TABLE game_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE NOT NULL,
    
    -- Action data
    action_type TEXT NOT NULL,
    player_id UUID REFERENCES players(id) NOT NULL,
    payload JSONB,
    
    -- Ordering
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_game_actions_room ON game_actions(game_room_id, sequence_number);

-- 5. RLS Policies

-- Matchmaking Queue
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Players can view their own queue entry
CREATE POLICY "Players can view own queue entry" ON matchmaking_queue
    FOR SELECT USING (player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
    ));

-- Players can join/leave queue
CREATE POLICY "Players can manage own queue entry" ON matchmaking_queue
    FOR ALL USING (player_id IN (
        SELECT id FROM players WHERE user_id = auth.uid()
    ));

-- Game Rooms
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

-- Players can view their own games
CREATE POLICY "Players can view own games" ON game_rooms
    FOR SELECT USING (
        player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        OR player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    );

-- Only system can create/update game rooms (via functions)
-- For now, allow players to update their own games
CREATE POLICY "Players can update own games" ON game_rooms
    FOR UPDATE USING (
        player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        OR player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    );

-- Game Actions
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- Players can view actions from their games
CREATE POLICY "Players can view own game actions" ON game_actions
    FOR SELECT USING (
        game_room_id IN (
            SELECT id FROM game_rooms 
            WHERE player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
               OR player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        )
    );

-- Players can insert actions in their games
CREATE POLICY "Players can insert game actions" ON game_actions
    FOR INSERT WITH CHECK (
        game_room_id IN (
            SELECT id FROM game_rooms 
            WHERE player1_id IN (SELECT id FROM players WHERE user_id = auth.uid())
               OR player2_id IN (SELECT id FROM players WHERE user_id = auth.uid())
        )
        AND player_id IN (SELECT id FROM players WHERE user_id = auth.uid())
    );

-- 6. Matchmaking function
CREATE OR REPLACE FUNCTION find_match(p_player_id UUID, p_deck_id UUID)
RETURNS UUID AS $$
DECLARE
    v_opponent RECORD;
    v_game_room_id UUID;
BEGIN
    -- Try to find an opponent in the queue
    SELECT * INTO v_opponent
    FROM matchmaking_queue
    WHERE player_id != p_player_id
    ORDER BY joined_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
    
    IF v_opponent IS NULL THEN
        -- No opponent found, add to queue
        INSERT INTO matchmaking_queue (player_id, deck_id)
        VALUES (p_player_id, p_deck_id)
        ON CONFLICT (player_id) DO UPDATE SET
            deck_id = EXCLUDED.deck_id,
            joined_at = NOW();
        
        RETURN NULL; -- No match yet
    ELSE
        -- Found opponent! Create game room
        INSERT INTO game_rooms (
            player1_id, player2_id,
            player1_deck_id, player2_deck_id,
            status, active_player_id
        ) VALUES (
            v_opponent.player_id, p_player_id,
            v_opponent.deck_id, p_deck_id,
            'waiting',
            -- Randomly select first player
            CASE WHEN random() < 0.5 THEN v_opponent.player_id ELSE p_player_id END
        )
        RETURNING id INTO v_game_room_id;
        
        -- Remove both players from queue
        DELETE FROM matchmaking_queue WHERE player_id IN (v_opponent.player_id, p_player_id);
        
        RETURN v_game_room_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Leave queue function
CREATE OR REPLACE FUNCTION leave_queue(p_player_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM matchmaking_queue WHERE player_id = p_player_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Get active game for player
CREATE OR REPLACE FUNCTION get_active_game(p_player_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM game_rooms
        WHERE (player1_id = p_player_id OR player2_id = p_player_id)
          AND status IN ('waiting', 'mulligan', 'playing')
        ORDER BY created_at DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Enable Realtime for game_rooms and matchmaking_queue
-- Run this in the Supabase Dashboard -> Database -> Replication
-- Or use:
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE matchmaking_queue;

-- ============================================
-- After running this migration:
-- 1. Verify tables are created
-- 2. Enable Realtime in Supabase Dashboard for game_rooms
-- ============================================

