-- Check if GM record exists
SELECT * FROM game_masters WHERE user_id = '2b3a6145-aca8-42be-a6af-4e9f1d12ebb7';

-- Check all GM records
SELECT * FROM game_masters;

-- Test the RPC function
SELECT is_game_master('2b3a6145-aca8-42be-a6af-4e9f1d12ebb7');
