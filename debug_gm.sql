-- Debug GM login issue
-- Run each query separately to see results

-- 1. Check what user ID is logged in (from console: e5a761e9-3267-4dc0-9d8d-8d83fcb35cb5)
SELECT id, email FROM auth.users WHERE email = 'supermassivestarcollision@gmail.com';

-- 2. Check all GM records
SELECT * FROM game_masters;

-- 3. Check if GM record exists for the correct user ID
SELECT * FROM game_masters WHERE user_id = 'e5a761e9-3267-4dc0-9d8d-8d83fcb35cb5';

-- 4. If no GM record, create one with the CORRECT user ID from step 1:
-- INSERT INTO game_masters (user_id, name, email) 
-- VALUES ('PUT_CORRECT_ID_HERE', 'Marko', 'supermassivestarcollision@gmail.com');

