
CREATE TABLE public.battle_pass (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  season integer NOT NULL DEFAULT 1,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  current_tier integer NOT NULL DEFAULT 0,
  xp_progress integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, season)
);

ALTER TABLE public.battle_pass ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own battle pass" ON public.battle_pass
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battle pass" ON public.battle_pass
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own battle pass" ON public.battle_pass
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
