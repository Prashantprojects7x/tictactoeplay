import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BATTLE_PASS_COST, BATTLE_PASS_SEASON, XP_PER_TIER, TOTAL_TIERS, BATTLE_PASS_TIERS } from "@/components/game/battlePassData";

export function useBattlePass() {
  const { user } = useAuth();
  const [owned, setOwned] = useState(false);
  const [currentTier, setCurrentTier] = useState(0);
  const [xpProgress, setXpProgress] = useState(0);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [bpRes, profileRes] = await Promise.all([
      supabase
        .from("battle_pass")
        .select("*")
        .eq("user_id", user.id)
        .eq("season", BATTLE_PASS_SEASON)
        .maybeSingle(),
      supabase.from("profiles").select("coins").eq("user_id", user.id).single(),
    ]);

    if (bpRes.data) {
      setOwned(true);
      setCurrentTier((bpRes.data as any).current_tier ?? 0);
      setXpProgress((bpRes.data as any).xp_progress ?? 0);
    } else {
      setOwned(false);
      setCurrentTier(0);
      setXpProgress(0);
    }

    if (profileRes.data) setCoins(profileRes.data.coins);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const purchase = useCallback(async () => {
    if (!user) { toast("Sign in to purchase"); return false; }
    if (coins < BATTLE_PASS_COST) { toast("Not enough coins! Need 1,000 🪙"); return false; }

    const { data, error } = await supabase.functions.invoke("economy", {
      body: { action: "purchase_battle_pass" },
    });

    if (error || data?.error) {
      toast(data?.error || "Purchase failed");
      return false;
    }

    setCoins(data.coins);
    setOwned(true);
    toast("🎉 Battle Pass Activated!");
    return true;
  }, [user, coins]);

  const addBattlePassXp = useCallback(async (xpAmount: number) => {
    if (!user || !owned) return;

    const { data, error } = await supabase.functions.invoke("economy", {
      body: { action: "add_bp_xp", xp_amount: xpAmount },
    });

    if (error || data?.error) return;

    setCurrentTier(data.current_tier);
    setXpProgress(data.xp_progress);

    if (data.current_tier > currentTier) {
      for (let t = currentTier + 1; t <= data.current_tier; t++) {
        const tierData = BATTLE_PASS_TIERS.find((bt) => bt.tier === t);
        toast(`🏆 Battle Pass Tier ${t} unlocked! ${tierData?.icon || ""}`);
      }
    }

    if (data.coins_earned > 0) {
      setCoins((c) => c + data.coins_earned);
    }
  }, [user, owned, currentTier]);

  return {
    owned, currentTier, xpProgress, coins, loading,
    purchase, addBattlePassXp, refresh: fetchData,
    TOTAL_TIERS, XP_PER_TIER, BATTLE_PASS_COST,
  };
}
