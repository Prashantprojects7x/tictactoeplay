
-- Seasonal events table
CREATE TABLE public.seasonal_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  season_type text NOT NULL DEFAULT 'custom', -- spring, summer, fall, winter, custom
  theme_id text, -- board theme slug
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active seasonal events"
  ON public.seasonal_events FOR SELECT
  TO authenticated
  USING (true);

-- Seasonal challenge progress per user
CREATE TABLE public.seasonal_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.seasonal_events(id) ON DELETE CASCADE,
  challenge_type text NOT NULL, -- 'win_count', 'daily_wins', 'streak'
  challenge_id text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  target integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  reward_claimed boolean NOT NULL DEFAULT false,
  last_updated date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id, challenge_id)
);

ALTER TABLE public.seasonal_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own seasonal progress"
  ON public.seasonal_challenge_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own seasonal progress"
  ON public.seasonal_challenge_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seasonal progress"
  ON public.seasonal_challenge_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
