CREATE TABLE public.daily_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  last_claim_date date NOT NULL DEFAULT CURRENT_DATE,
  current_streak integer NOT NULL DEFAULT 1,
  total_claims integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily rewards"
  ON public.daily_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily rewards"
  ON public.daily_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);