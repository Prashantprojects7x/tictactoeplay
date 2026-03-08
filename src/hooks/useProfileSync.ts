import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfileSync() {
  const { user } = useAuth();

  const syncGameResult = useCallback(
    async (outcome: "win" | "loss" | "draw", elapsed: number, xpGained: number) => {
      if (!user) return null;

      // Fetch current profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!profile) return null;

      const updates: Record<string, unknown> = {
        total_games: profile.total_games + 1,
      };

      if (outcome === "win") {
        updates.total_wins = profile.total_wins + 1;
        updates.win_streak = profile.win_streak + 1;
        updates.coins = profile.coins + 10;
        if (profile.win_streak + 1 > profile.max_streak) {
          updates.max_streak = profile.win_streak + 1;
        }
        if (elapsed > 0 && (profile.best_time === null || elapsed < profile.best_time)) {
          updates.best_time = elapsed;
        }
      } else if (outcome === "loss") {
        updates.win_streak = 0;
      }

      // XP & Level
      const { processXpGain } = await import("@/components/game/progression");
      const { newXp, newLevel } = processXpGain(
        profile.xp as number,
        profile.level as number,
        xpGained
      );
      updates.xp = newXp;
      updates.level = newLevel;

      const { data: updated } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      return updated;
    },
    [user]
  );

  const addCoinsToProfile = useCallback(
    async (amount: number) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({ coins: Math.max(0, profile.coins + amount) })
          .eq("user_id", user.id);
      }
    },
    [user]
  );

  return { syncGameResult, addCoinsToProfile };
}
