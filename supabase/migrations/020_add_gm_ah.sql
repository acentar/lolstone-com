-- Add Game Master access for ah@lolstone.com
-- User must already exist in auth.users (UID: 313a109f-9b71-4d85-901f-d523f5421429)
-- Run this in Supabase SQL Editor if migration fails due to RLS (Dashboard → SQL Editor → New query)

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
