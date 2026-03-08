import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfileSync() {
  const { user } = useAuth();

  const syncGameResult = useCallback(
    async (outcome: "win" | "loss" | "draw", elapsed: number, xpGained: number) => {
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke("economy", {
        body: { action: "sync_game", outcome, elapsed, xp_gained: xpGained },
      });

      if (error) { console.error("syncGameResult error:", error); return null; }
      return data?.profile ?? null;
    },
    [user]
  );

  return { syncGameResult };
}
