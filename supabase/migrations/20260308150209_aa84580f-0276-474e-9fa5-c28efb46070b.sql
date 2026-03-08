
-- 1. CHECK constraints on profiles to prevent negative values
ALTER TABLE public.profiles ADD CONSTRAINT check_coins_non_negative CHECK (coins >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT check_total_wins_non_negative CHECK (total_wins >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT check_total_games_non_negative CHECK (total_games >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT check_xp_non_negative CHECK (xp >= 0);
ALTER TABLE public.profiles ADD CONSTRAINT check_level_positive CHECK (level >= 1);

-- 2. Fix SELECT policy: restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- 3. Economy guard trigger: block direct client-side modifications of economy columns
CREATE OR REPLACE FUNCTION public.guard_economy_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text;
BEGIN
  jwt_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  );

  -- Allow service_role (edge functions) to modify any column
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block economy column changes from regular authenticated users
  IF NEW.coins IS DISTINCT FROM OLD.coins
    OR NEW.xp IS DISTINCT FROM OLD.xp
    OR NEW.level IS DISTINCT FROM OLD.level
    OR NEW.total_wins IS DISTINCT FROM OLD.total_wins
    OR NEW.total_games IS DISTINCT FROM OLD.total_games
    OR NEW.win_streak IS DISTINCT FROM OLD.win_streak
    OR NEW.max_streak IS DISTINCT FROM OLD.max_streak
    OR NEW.best_time IS DISTINCT FROM OLD.best_time
  THEN
    RAISE EXCEPTION 'Economy columns cannot be modified directly. Use the economy API.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_economy_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_economy_columns();
