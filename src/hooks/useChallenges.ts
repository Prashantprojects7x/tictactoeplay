import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useChallenges() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingChallenge, setPendingChallenge] = useState<any>(null);

  // Listen for incoming challenges in realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("challenges-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_challenges",
          filter: `challenged_id=eq.${user.id}`,
        },
        async (payload) => {
          const challenge = payload.new as any;
          if (challenge.status !== "pending") return;

          // Get challenger profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", challenge.challenger_id)
            .single();

          setPendingChallenge({
            ...challenge,
            challengerName: profile?.display_name || "A friend",
            challengerAvatar: profile?.avatar_url || "🎮",
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const sendChallenge = useCallback(async (friendUserId: string, roomCode: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("game_challenges")
      .insert({
        challenger_id: user.id,
        challenged_id: friendUserId,
        room_code: roomCode,
      });

    if (error) { toast("Failed to send challenge"); return false; }
    toast("⚔️ Challenge sent!");
    return true;
  }, [user]);

  const acceptChallenge = useCallback(async (challengeId: string, roomCode: string) => {
    await supabase
      .from("game_challenges")
      .update({ status: "accepted" })
      .eq("id", challengeId);

    setPendingChallenge(null);

    // Navigate to game with room code in URL state
    navigate("/?join=" + roomCode);
  }, [navigate]);

  const declineChallenge = useCallback(async (challengeId: string) => {
    await supabase
      .from("game_challenges")
      .update({ status: "declined" })
      .eq("id", challengeId);

    setPendingChallenge(null);
    toast("Challenge declined");
  }, []);

  const dismissChallenge = useCallback(() => {
    setPendingChallenge(null);
  }, []);

  return {
    pendingChallenge, sendChallenge, acceptChallenge, declineChallenge, dismissChallenge,
  };
}
