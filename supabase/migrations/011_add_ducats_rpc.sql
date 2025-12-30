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
BEGIN
  -- Get player by user_id
  SELECT id, ducats INTO v_player_id, v_new_balance
  FROM players
  WHERE user_id = p_user_id;
  
  IF v_player_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Player not found');
  END IF;
  
  -- Add ducats
  v_new_balance := COALESCE(v_new_balance, 0) + p_amount;
  
  UPDATE players
  SET ducats = v_new_balance
  WHERE id = v_player_id;
  
  -- Record transaction
  INSERT INTO transactions (type, to_player_id, ducats_amount, description)
  VALUES ('deposit', v_player_id, p_amount, 'Crypto ducat purchase');
  
  RETURN json_build_object(
    'success', true,
    'player_id', v_player_id,
    'new_balance', v_new_balance
  );
END;
$$;

