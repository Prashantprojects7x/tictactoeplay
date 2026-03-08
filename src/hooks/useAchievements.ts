import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ACHIEVEMENTS, type Achievement } from "@/components/game/achievementsData";

export interface UnlockedAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, number | null> | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [achRes, profileRes] = await Promise.all([
      supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("total_wins, total_games, max_streak, level, coins, best_time")
        .eq("user_id", user.id)
        .single(),
    ]);

    if (achRes.data) setUnlocked(achRes.data as UnlockedAchievement[]);
    if (profileRes.data) setProfile(profileRes.data as Record<string, number | null>);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isUnlocked = useCallback(
    (achievementId: string) => unlocked.some((a) => a.achievement_id === achievementId),
    [unlocked]
  );

  const getProgress = useCallback(
    (achievement: Achievement): number => {
      if (!profile) return 0;
      const statValue = profile[achievement.requirement.stat];
      if (statValue === null || statValue === undefined) return 0;

      const comparator = achievement.requirement.comparator ?? "gte";
      if (comparator === "lte") {
        if (statValue <= achievement.requirement.value) return 100;
        return Math.min(99, Math.round((achievement.requirement.value / statValue) * 100));
      }

      return Math.min(100, Math.round((statValue / achievement.requirement.value) * 100));
    },
    [profile]
  );

  // Check and claim newly completed achievements via server-verified endpoint
  const checkAndClaim = useCallback(async () => {
    if (!user || !profile) return [];

    const newlyUnlocked: Achievement[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (isUnlocked(ach.id)) continue;

      const statValue = profile[ach.requirement.stat];
      if (statValue === null || statValue === undefined) continue;

      const comparator = ach.requirement.comparator ?? "gte";
      const met = comparator === "lte"
        ? statValue <= ach.requirement.value
        : statValue >= ach.requirement.value;

      if (met) {
        // Use server-verified claim_achievement action
        const { data, error } = await supabase.functions.invoke("economy", {
          body: { action: "claim_achievement", achievement_id: ach.id },
        });

        if (!error && !data?.error) {
          newlyUnlocked.push(ach);
          toast(`🏅 Achievement Unlocked: ${ach.name}! +${ach.coinReward} coins`);
        }
      }
    }

    if (newlyUnlocked.length > 0) {
      await fetchData();
    }

    return newlyUnlocked;
  }, [user, profile, isUnlocked, fetchData]);

  return {
    achievements: ACHIEVEMENTS,
    unlocked,
    loading,
    profile,
    isUnlocked,
    getProgress,
    checkAndClaim,
    refresh: fetchData,
  };
}
