
-- Fix overly permissive UPDATE on tournament_participants
DROP POLICY "System can update participants" ON public.tournament_participants;
CREATE POLICY "Tournament creator can update participants" ON public.tournament_participants
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
    OR auth.uid() = user_id
  );

-- Fix overly permissive INSERT on tournament_matches  
DROP POLICY "System can insert matches" ON public.tournament_matches;
CREATE POLICY "Tournament creator can insert matches" ON public.tournament_matches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );
