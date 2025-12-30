-- Fix Game Master RLS Policy Circular Dependency
-- The issue: To check if someone is a GM, you need to read game_masters table
-- But the table requires you to BE a GM to read it!

-- Allow users to check their own GM status
CREATE POLICY "Users can check own GM status" ON game_masters
    FOR SELECT USING (auth.uid() = user_id);

-- Note: This policy allows any authenticated user to check if THEIR OWN user_id
-- has a GM record. They can only see their own record, not other GMs.
-- The existing "GMs can view all GMs" policy still allows GMs to see all records.

