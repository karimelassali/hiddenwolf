-- Add new columns for room settings
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS round_duration INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS total_rounds INTEGER DEFAULT 5;

-- Update store table
ALTER TABLE store 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Fix store id column to auto-generate UUIDs
ALTER TABLE store 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add XP and Level columns for the level system
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
