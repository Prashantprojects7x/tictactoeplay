
-- Update guard trigger to also protect diamond_tokens
CREATE OR REPLACE FUNCTION public.guard_economy_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  );

  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.coins IS DISTINCT FROM OLD.coins
    OR NEW.xp IS DISTINCT FROM OLD.xp
    OR NEW.level IS DISTINCT FROM OLD.level
    OR NEW.total_wins IS DISTINCT FROM OLD.total_wins
    OR NEW.total_games IS DISTINCT FROM OLD.total_games
    OR NEW.win_streak IS DISTINCT FROM OLD.win_streak
    OR NEW.max_streak IS DISTINCT FROM OLD.max_streak
    OR NEW.best_time IS DISTINCT FROM OLD.best_time
    OR NEW.diamond_tokens IS DISTINCT FROM OLD.diamond_tokens
  THEN
    RAISE EXCEPTION 'Economy columns cannot be modified directly. Use the economy API.';
  END IF;

  RETURN NEW;
END;
$$;
