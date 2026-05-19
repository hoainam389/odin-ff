-- Replace member rosters with the real 14 players and rename each team
-- to the first words of its two members' names, sorted alphabetically.
-- Idempotent: TRUNCATEs members first, then re-inserts; updates team names.
DO $seed_members$
BEGIN
  TRUNCATE TABLE members RESTART IDENTITY;

  INSERT INTO members (team_id, name) VALUES
    ('A', 'Phuong Ho Nguyen'),
    ('A', 'Khanh Nhat Hoang Vo'),
    ('B', 'Vu Van Nguyen'),
    ('B', 'Tam Ngoc Nguyen'),
    ('C', 'Phuong Duy Nguyen'),
    ('C', 'Quan Van Pham'),
    ('D', 'Nam Hoai Nguyen'),
    ('D', 'Manh Tien Vu'),
    ('E', 'Trung Thanh Vuong'),
    ('E', 'Huy Quang Pham'),
    ('F', 'Dung Tien Nguyen'),
    ('F', 'Tien Manh Le'),
    ('G', 'Nam Van Le'),
    ('G', 'Thin Ngoc Hoang');

  -- Team name = first words of both members joined by space, A→Z.
  UPDATE teams t SET name = sub.team_name
  FROM (
    SELECT team_id,
           string_agg(split_part(name, ' ', 1), ' '
                      ORDER BY split_part(name, ' ', 1)) AS team_name
    FROM members
    GROUP BY team_id
  ) sub
  WHERE t.id = sub.team_id;
END
$seed_members$;
