-- ============================================
-- MIGRATION: Add Card Image Support
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add image_url column to card_designs
ALTER TABLE card_designs 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create storage bucket for card images (run in Supabase Dashboard -> Storage)
-- Note: This SQL needs to be run separately in the Storage section
-- Or use the Supabase Dashboard to create the bucket manually:
-- 
-- Bucket name: card-images
-- Public bucket: true (so images can be displayed)
-- File size limit: 5MB
-- Allowed MIME types: image/png, image/jpeg, image/webp, image/gif

-- 3. Storage bucket policies (run in SQL Editor)
-- First, insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'card-images',
    'card-images', 
    true,
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

-- 4. Storage policies for authenticated users (Game Masters can upload)
-- Allow GMs to upload images
CREATE POLICY "GMs can upload card images" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'card-images' 
        AND is_game_master(auth.uid())
    );

-- Allow GMs to update/delete their images
CREATE POLICY "GMs can manage card images" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'card-images' 
        AND is_game_master(auth.uid())
    );

CREATE POLICY "GMs can delete card images" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'card-images' 
        AND is_game_master(auth.uid())
    );

-- Allow anyone to view card images (public bucket)
CREATE POLICY "Anyone can view card images" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'card-images');

-- ============================================
-- After running this migration:
-- 1. Go to Supabase Dashboard -> Storage
-- 2. Verify the 'card-images' bucket exists
-- 3. If not, create it manually with these settings:
--    - Name: card-images
--    - Public: Yes
--    - Max file size: 5MB
-- ============================================

