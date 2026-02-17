-- GAME HISTORY TABLE
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

CREATE TABLE IF NOT EXISTS game_history (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  room_code TEXT NOT NULL,
  role TEXT NOT NULL,
  team TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
  survived BOOLEAN DEFAULT FALSE,
  xp_earned INT DEFAULT 0,
  coins_earned INT DEFAULT 0,
  player_count INT DEFAULT 0,
  rounds INT DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast query by player
CREATE INDEX IF NOT EXISTS idx_game_history_player ON game_history (player_id, played_at DESC);

-- Row Level Security (optional — enable if using Supabase auth)
-- ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users read own history" ON game_history FOR SELECT USING (player_id = auth.uid()::text);
-- CREATE POLICY "Insert game history" ON game_history FOR INSERT WITH CHECK (true);
