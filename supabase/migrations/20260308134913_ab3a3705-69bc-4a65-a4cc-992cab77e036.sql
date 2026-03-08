
-- Tournaments table
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  entry_fee integer NOT NULL DEFAULT 50,
  prize_pool integer NOT NULL DEFAULT 0,
  max_players integer NOT NULL DEFAULT 8,
  current_round integer NOT NULL DEFAULT 0,
  winner_id uuid,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  finished_at timestamp with time zone
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" ON public.tournaments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tournaments" ON public.tournaments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update tournament" ON public.tournaments
  FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  seed integer,
  eliminated boolean NOT NULL DEFAULT false,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.tournament_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join tournaments" ON public.tournament_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update participants" ON public.tournament_participants
  FOR UPDATE TO authenticated USING (true);

-- Tournament matches
CREATE TABLE public.tournament_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round integer NOT NULL,
  match_index integer NOT NULL,
  player1_id uuid,
  player2_id uuid,
  winner_id uuid,
  room_code text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  finished_at timestamp with time zone
);

ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON public.tournament_matches
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Players can update their matches" ON public.tournament_matches
  FOR UPDATE TO authenticated
  USING (auth.uid() = player1_id OR auth.uid() = player2_id);

CREATE POLICY "System can insert matches" ON public.tournament_matches
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for tournaments
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;
