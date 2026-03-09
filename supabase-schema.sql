CREATE TABLE game_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert the initial row
INSERT INTO game_state (id, players, results) VALUES ('main', '[]', '{}');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- Allow public read/write (no auth needed for 3-friend game)
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON game_state FOR ALL USING (true) WITH CHECK (true);
