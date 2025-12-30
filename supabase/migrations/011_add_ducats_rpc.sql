-- Migration: Add RPC function for crediting ducats
-- Used by the payment confirmation API

-- Function to add ducats to a player
CREATE OR REPLACE FUNCTION add_ducats(p_user_id UUID, p_amount INT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_new_balance INT;
  v_current_ducats INT;
BEGIN
  -- Get player by user_id
  SELECT id, ducats INTO v_player_id, v_current_ducats
  FROM players
  WHERE user_id = p_user_id;

  IF v_player_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player not found for user_id: ' || p_user_id::text);
  END IF;

  -- Add ducats
  v_new_balance := COALESCE(v_current_ducats, 0) + p_amount;

  -- Update player balance
  UPDATE players
  SET ducats = v_new_balance
  WHERE id = v_player_id;

  -- Record transaction
  INSERT INTO transactions (type, to_player_id, ducats_amount, description)
  VALUES ('deposit', v_player_id, p_amount, 'Crypto ducat purchase');

  RETURN json_build_object(
    'success', true,
    'player_id', v_player_id,
    'previous_balance', COALESCE(v_current_ducats, 0),
    'added_amount', p_amount,
    'new_balance', v_new_balance
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_ducats(UUID, INT) TO authenticated;

-- Also grant to service_role for admin operations
GRANT EXECUTE ON FUNCTION add_ducats(UUID, INT) TO service_role;

-- Ensure players table allows authenticated users to update their own record
DROP POLICY IF EXISTS "Users can update own player" ON players;
CREATE POLICY "Users can update own player" ON players
FOR UPDATE USING (auth.uid() = user_id);

-- Ensure players table allows authenticated users to read their own record
DROP POLICY IF EXISTS "Users can read own player" ON players;
CREATE POLICY "Users can read own player" ON players
FOR SELECT USING (auth.uid() = user_id);

-- Ensure players table allows authenticated users to insert their own record
DROP POLICY IF EXISTS "Users can insert own player" ON players;
CREATE POLICY "Users can insert own player" ON players
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure transactions table allows authenticated users to insert records for themselves
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions" ON transactions
FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM players WHERE id = to_player_id) OR
  auth.uid() = (SELECT user_id FROM players WHERE id = from_player_id)
);

-- Add player presence tracking to game_rooms
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS player1_connected BOOLEAN DEFAULT true;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS player2_connected BOOLEAN DEFAULT true;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS player1_disconnected_at TIMESTAMPTZ;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS player2_disconnected_at TIMESTAMPTZ;

-- Function to update player presence
CREATE OR REPLACE FUNCTION update_player_presence(p_game_room_id UUID, p_player_id UUID, p_connected BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_player1 BOOLEAN;
BEGIN
  -- Check if player is player1 or player2
  SELECT (player1_id = p_player_id) INTO v_is_player1
  FROM game_rooms WHERE id = p_game_room_id;

  IF v_is_player1 IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_is_player1 THEN
    UPDATE game_rooms SET
      player1_connected = p_connected,
      player1_disconnected_at = CASE WHEN NOT p_connected THEN NOW() ELSE NULL END
    WHERE id = p_game_room_id;
  ELSE
    UPDATE game_rooms SET
      player2_connected = p_connected,
      player2_disconnected_at = CASE WHEN NOT p_connected THEN NOW() ELSE NULL END
    WHERE id = p_game_room_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for disconnected players and declare winners
CREATE OR REPLACE FUNCTION check_disconnected_players()
RETURNS INTEGER AS $$
DECLARE
  v_game_record RECORD;
  v_winner_id UUID;
  v_return_window_minutes INTEGER := 3; -- 3 minutes
BEGIN
  FOR v_game_record IN
    SELECT id, player1_id, player2_id, player1_connected, player2_connected,
           player1_disconnected_at, player2_disconnected_at
    FROM game_rooms
    WHERE status = 'playing'
      AND (NOT player1_connected OR NOT player2_connected)
  LOOP
    -- Check if player1 is disconnected and return window has expired
    IF NOT v_game_record.player1_connected
       AND v_game_record.player1_disconnected_at IS NOT NULL
       AND (NOW() - v_game_record.player1_disconnected_at) > INTERVAL '3 minutes' THEN
      -- Player1 has been disconnected too long, player2 wins
      UPDATE game_rooms SET
        status = 'ended',
        winner_id = v_game_record.player2_id,
        ended_at = NOW()
      WHERE id = v_game_record.id;

    -- Check if player2 is disconnected and return window has expired
    ELSIF NOT v_game_record.player2_connected
          AND v_game_record.player2_disconnected_at IS NOT NULL
          AND (NOW() - v_game_record.player2_disconnected_at) > INTERVAL '3 minutes' THEN
      -- Player2 has been disconnected too long, player1 wins
      UPDATE game_rooms SET
        status = 'ended',
        winner_id = v_game_record.player1_id,
        ended_at = NOW()
      WHERE id = v_game_record.id;
    END IF;
  END LOOP;

  RETURN 0; -- Success
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get disconnected players info (for client-side polling)
CREATE OR REPLACE FUNCTION get_disconnected_games()
RETURNS TABLE(
  game_id UUID,
  disconnected_player_id UUID,
  disconnected_at TIMESTAMPTZ,
  opponent_id UUID,
  minutes_elapsed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gr.id as game_id,
    CASE
      WHEN NOT gr.player1_connected THEN gr.player1_id
      WHEN NOT gr.player2_connected THEN gr.player2_id
    END as disconnected_player_id,
    CASE
      WHEN NOT gr.player1_connected THEN gr.player1_disconnected_at
      WHEN NOT gr.player2_connected THEN gr.player2_disconnected_at
    END as disconnected_at,
    CASE
      WHEN NOT gr.player1_connected THEN gr.player2_id
      WHEN NOT gr.player2_connected THEN gr.player1_id
    END as opponent_id,
    CASE
      WHEN NOT gr.player1_connected THEN EXTRACT(EPOCH FROM (NOW() - gr.player1_disconnected_at)) / 60
      WHEN NOT gr.player2_connected THEN EXTRACT(EPOCH FROM (NOW() - gr.player2_disconnected_at)) / 60
    END::INTEGER as minutes_elapsed
  FROM game_rooms gr
  WHERE gr.status = 'playing'
    AND (NOT gr.player1_connected OR NOT gr.player2_connected);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_disconnected_games() TO authenticated;

