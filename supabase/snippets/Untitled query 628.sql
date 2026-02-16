-- Add XP and Level columns for the level system
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
