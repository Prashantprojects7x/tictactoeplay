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

    const { error: coinErr } = await supabase
      .from("profiles")
      .update({ coins: coins - BATTLE_PASS_COST })
      .eq("user_id", user.id);

    if (coinErr) { toast("Failed to deduct coins"); return false; }

    const { error: bpErr } = await supabase
      .from("battle_pass")
      .insert({ user_id: user.id, season: BATTLE_PASS_SEASON, current_tier: 0, xp_progress: 0 });

    if (bpErr) {
      await supabase.from("profiles").update({ coins }).eq("user_id", user.id);
      toast("Purchase failed");
      return false;
    }

    setCoins((c) => c - BATTLE_PASS_COST);
    setOwned(true);
    toast("🎉 Battle Pass Activated!");
    return true;
  }, [user, coins]);

  const addBattlePassXp = useCallback(async (xpAmount: number) => {
    if (!user || !owned) return;

    let newXp = xpProgress + xpAmount;
    let newTier = currentTier;
    let coinsToAdd = 0;

    while (newTier < TOTAL_TIERS && newXp >= XP_PER_TIER) {
      newXp -= XP_PER_TIER;
      newTier += 1;

      // Grant tier reward
      const tierData = BATTLE_PASS_TIERS.find((t) => t.tier === newTier);
      if (tierData && tierData.type === "coins") {
        coinsToAdd += tierData.value as number;
      }

      toast(`🏆 Battle Pass Tier ${newTier} unlocked! ${tierData?.icon || ""}`);
    }

    if (newTier >= TOTAL_TIERS) newXp = 0;

    await supabase
      .from("battle_pass")
      .update({ current_tier: newTier, xp_progress: newXp })
      .eq("user_id", user.id)
      .eq("season", BATTLE_PASS_SEASON);

    if (coinsToAdd > 0) {
      const { data: profile } = await supabase.from("profiles").select("coins").eq("user_id", user.id).single();
      if (profile) {
        await supabase.from("profiles").update({ coins: profile.coins + coinsToAdd }).eq("user_id", user.id);
        setCoins(profile.coins + coinsToAdd);
      }
    }

    setCurrentTier(newTier);
    setXpProgress(newXp);
  }, [user, owned, currentTier, xpProgress]);

  return {
    owned, currentTier, xpProgress, coins, loading,
    purchase, addBattlePassXp, refresh: fetchData,
    TOTAL_TIERS, XP_PER_TIER, BATTLE_PASS_COST,
  };
}
