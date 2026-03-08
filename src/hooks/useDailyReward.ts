import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DAILY_REWARDS = [10, 20, 30, 40, 50, 75, 150];

export function useDailyReward() {
  const { user } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lastClaimResult, setLastClaimResult] = useState<{ coins: number; streak: number } | null>(null);

  const checkStatus = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("daily_rewards")
      .select("last_claim_date, current_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    const today = new Date().toISOString().split("T")[0];

    if (!data) {
      setCanClaim(true);
      setCurrentStreak(0);
    } else {
      setCanClaim(data.last_claim_date !== today);
      const lastDate = new Date(data.last_claim_date);
      const todayDate = new Date(today);
      const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      setCurrentStreak(diffDays <= 1 ? data.current_streak : 0);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // Auto-show modal when user logs in and can claim
  useEffect(() => {
    if (!loading && canClaim && user) {
      const dismissed = sessionStorage.getItem("daily_reward_dismissed");
      if (!dismissed) setShowModal(true);
    }
  }, [loading, canClaim, user]);

  const claim = useCallback(async () => {
    if (!user || claiming) return null;
    setClaiming(true);

    const { data, error } = await supabase.functions.invoke("economy", {
      body: { action: "claim_daily_reward" },
    });

    setClaiming(false);

    if (error || data?.error) return null;

    setCanClaim(false);
    setCurrentStreak(data.current_streak);
    setLastClaimResult({ coins: data.coins_awarded, streak: data.current_streak });
    return data;
  }, [user, claiming]);

  const dismissModal = useCallback(() => {
    setShowModal(false);
    sessionStorage.setItem("daily_reward_dismissed", "true");
  }, []);

  const getRewardForDay = (day: number) => DAILY_REWARDS[(day - 1) % 7];

  return {
    canClaim, currentStreak, loading, claiming, showModal, lastClaimResult,
    claim, dismissModal, getRewardForDay, DAILY_REWARDS,
  };
}
