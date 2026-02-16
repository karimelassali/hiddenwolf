-- ============================================================
-- HiddenWolf - Supabase Storage Buckets Setup
-- ============================================================
-- This script creates all storage buckets required by the project
-- and sets up the necessary RLS (Row Level Security) policies.
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ============================================================
-- 1. BUCKET: store-assets
-- ============================================================
-- Purpose: Stores all uploaded assets for the in-game store,
--          including avatar images, sound files, and power-up icons.
-- Used by: app/upload/page.jsx (admin upload panel)
--          app/store/page.jsx (public store display)
--          app/profile/page.jsx (equipped avatar display)
--          app/ranking/page.jsx (player avatar display)
--          app/room/[uid]/page.jsx (player profile in room)
--          app/game/[uid]/page.jsx (player profile in game)
-- ============================================================

-- Create the bucket (public = true so files can be accessed via public URL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;


-- ──────────────────────────────────────────────────────────────
-- READ POLICY (Public)
-- Everyone can view/download store assets (images, sounds, etc.)
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "Store assets are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');


-- ──────────────────────────────────────────────────────────────
-- WRITE POLICIES (Restricted to service_role only)
-- Since the project uses Clerk for auth (not Supabase Auth),
-- we CANNOT use auth.uid() in policies. Instead, write
-- operations are blocked for the anon key entirely.
-- 
-- The upload page (/upload) should be converted to use an
-- API route that calls Supabase with the service_role key,
-- which BYPASSES RLS entirely — making these restrictive 
-- policies safe.
-- 
-- With these policies, the anon key can only READ files.
-- ──────────────────────────────────────────────────────────────

-- UPLOAD: Only service_role can insert (anon key blocked)
CREATE POLICY "Only admins can upload store assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (SELECT auth.role()) = 'service_role'
  );

-- UPDATE: Only service_role can update/replace files
CREATE POLICY "Only admins can update store assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (SELECT auth.role()) = 'service_role'
  );

-- DELETE: Only service_role can delete files
CREATE POLICY "Only admins can delete store assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND (SELECT auth.role()) = 'service_role'
  );
