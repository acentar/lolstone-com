-- Grant /gmp access to ah@lolstone.com
-- Run this in Supabase Dashboard → SQL Editor (as postgres/service role if RLS blocks it)
-- User must already exist in auth.users

INSERT INTO game_masters (user_id, name, email)
VALUES (
  '313a109f-9b71-4d85-901f-d523f5421429',
  'AH',
  'ah@lolstone.com'
)
ON CONFLICT (user_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();
