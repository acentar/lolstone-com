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

