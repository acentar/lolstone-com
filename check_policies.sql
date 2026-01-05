-- Check all RLS policies on game_masters table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'game_masters';

-- Check if is_game_master function exists
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'is_game_master';

-- Test direct GM check (should return your record if RLS allows)
SELECT * FROM game_masters WHERE user_id = 'e5a761e9-3267-4dc0-9d8d-8d83fcb35cb5';

