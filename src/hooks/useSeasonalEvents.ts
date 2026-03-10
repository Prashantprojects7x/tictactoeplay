import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { SeasonalEvent, SeasonalChallengeProgress, SeasonalChallenge } from "@/components/game/seasonalData";
import { getSeasonalChallenges } from "@/components/game/seasonalData";

export function useSeasonalEvents() {
  const { user } = useAuth();
  const [currentEvent, setCurrentEvent] = useState<SeasonalEvent | null>(null);
  const [progress, setProgress] = useState<SeasonalChallengeProgress[]>([]);
  const [challenges, setChallenges] = useState<SeasonalChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();

    // Get current active event
    const { data: events } = await supabase
      .from("seasonal_events")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("start_date", { ascending: false })
      .limit(1);

    if (events && events.length > 0) {
      const event = events[0] as unknown as SeasonalEvent;
      setCurrentEvent(event);
      setChallenges(getSeasonalChallenges(event.season_type));

      if (user) {
        const { data: prog } = await supabase
          .from("seasonal_challenge_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("event_id", event.id);

        setProgress((prog as unknown as SeasonalChallengeProgress[]) || []);
      }
    } else {
      setCurrentEvent(null);
      setChallenges([]);
      setProgress([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getChallengeProgress = useCallback((challengeId: string): SeasonalChallengeProgress | undefined => {
    return progress.find((p) => p.challenge_id === challengeId);
  }, [progress]);

  const recordSeasonalWin = useCallback(async (winStreak: number) => {
    if (!user || !currentEvent) return;

    const today = new Date().toISOString().split("T")[0];

    for (const challenge of challenges) {
      const existing = progress.find((p) => p.challenge_id === challenge.id);

      if (existing?.completed) continue;

      let newProgress = 0;

      if (challenge.type === "win_count") {
        newProgress = (existing?.progress || 0) + 1;
      } else if (challenge.type === "daily_wins") {
        // Reset daily if different day
        if (existing && existing.last_updated !== today) {
          newProgress = 1;
        } else {
          newProgress = (existing?.progress || 0) + 1;
        }
      } else if (challenge.type === "streak") {
        newProgress = Math.max(existing?.progress || 0, winStreak);
      }

      const completed = newProgress >= challenge.target;

      if (existing) {
        await supabase
          .from("seasonal_challenge_progress")
          .update({
            progress: newProgress,
            completed,
            last_updated: today,
          })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("seasonal_challenge_progress")
          .insert({
            user_id: user.id,
            event_id: currentEvent.id,
            challenge_type: challenge.type,
            challenge_id: challenge.id,
            progress: newProgress,
            target: challenge.target,
            completed,
            last_updated: today,
          });
      }

      if (completed && !existing?.completed) {
        toast(`🎉 Seasonal Challenge Complete: ${challenge.name}!`);
      }
    }

    // Refresh progress
    await fetchEvents();
  }, [user, currentEvent, challenges, progress, fetchEvents]);

  const claimReward = useCallback(async (challengeId: string) => {
    if (!user || !currentEvent) return false;

    const prog = progress.find((p) => p.challenge_id === challengeId);
    if (!prog || !prog.completed || prog.reward_claimed) return false;

    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return false;

    // Mark as claimed and award reward via server-side edge function
    const { error } = await supabase.functions.invoke("economy", {
      body: { action: "seasonal_reward", challenge_id: challengeId, event_id: currentEvent.id },
    });

    if (error) {
      toast.error("Failed to claim reward");
      return false;
    }

    toast(`🎁 Claimed: ${challenge.name} reward!`);
    await fetchEvents();
    return true;
  }, [user, currentEvent, progress, challenges, fetchEvents]);

  const timeRemaining = currentEvent ? {
    total: new Date(currentEvent.end_date).getTime() - Date.now(),
    days: Math.max(0, Math.floor((new Date(currentEvent.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    hours: Math.max(0, Math.floor(((new Date(currentEvent.end_date).getTime() - Date.now()) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
  } : null;

  return {
    currentEvent,
    challenges,
    progress,
    loading,
    getChallengeProgress,
    recordSeasonalWin,
    claimReward,
    timeRemaining,
    refresh: fetchEvents,
  };
}
