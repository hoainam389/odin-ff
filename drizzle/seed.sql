-- ODIN Champion League — seed data
-- Paste this entire block into Supabase SQL Editor and Run.
-- Idempotent: wipes existing data first.
DO $seed$
BEGIN

  TRUNCATE TABLE results, matches, members, teams RESTART IDENTITY CASCADE;

  INSERT INTO teams (id, name, emoji, color, display_order) VALUES
    ('A', 'Team Alpha', '🦅', '#00d4ff', 0),
    ('B', 'Team Beta',  '🐉', '#7c3aed', 1),
    ('C', 'Team Cobra', '🦁', '#22c55e', 2),
    ('D', 'Team Delta', '⚡', '#f97316', 3),
    ('E', 'Team Eagle', '🔥', '#ef4444', 4),
    ('F', 'Team Fenix', '🌊', '#fbbf24', 5),
    ('G', 'Team Ghost', '🌙', '#ec4899', 6);

  INSERT INTO members (team_id, name) VALUES
    ('A', 'Player 1'),  ('A', 'Player 2'),
    ('B', 'Player 3'),  ('B', 'Player 4'),
    ('C', 'Player 5'),  ('C', 'Player 6'),
    ('D', 'Player 7'),  ('D', 'Player 8'),
    ('E', 'Player 9'),  ('E', 'Player 10'),
    ('F', 'Player 11'), ('F', 'Player 12'),
    ('G', 'Player 13'), ('G', 'Player 14');

  -- 21-match round-robin, 3 per workday starting 2026-05-18 (Mon)
  INSERT INTO matches (home_team, away_team, match_date, display_order) VALUES
    ('B','G','2026-05-18', 0),
    ('C','F','2026-05-18', 1),
    ('D','E','2026-05-18', 2),
    ('A','G','2026-05-19', 3),
    ('B','E','2026-05-19', 4),
    ('C','D','2026-05-19', 5),
    ('A','F','2026-05-20', 6),
    ('G','E','2026-05-20', 7),
    ('B','C','2026-05-20', 8),
    ('A','E','2026-05-21', 9),
    ('F','D','2026-05-21',10),
    ('G','C','2026-05-21',11),
    ('A','D','2026-05-22',12),
    ('E','C','2026-05-22',13),
    ('F','B','2026-05-22',14),
    ('A','C','2026-05-25',15),
    ('D','B','2026-05-25',16),
    ('F','G','2026-05-25',17),
    ('A','B','2026-05-26',18),
    ('D','G','2026-05-26',19),
    ('E','F','2026-05-26',20);

  -- Enable Realtime on the tables the public pages subscribe to.
  -- Wrapped so re-runs don't fail with "already member of publication".
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.results;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

END
$seed$;
