import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Tournament {
  id: string;
  name: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  max_players: number;
  current_round: number;
  winner_id: string | null;
  created_by: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  participant_count?: number;
  creator_name?: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  seed: number | null;
  eliminated: boolean;
  display_name?: string;
  avatar_url?: string;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_index: number;
  player1_id: string | null;
  player2_id: string | null;
  winner_id: string | null;
  room_code: string | null;
  status: string;
  player1_name?: string;
  player2_name?: string;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function useTournament() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCoins, setUserCoins] = useState(0);

  const fetchTournaments = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false });

    if (data) {
      const tournamentsWithCounts: Tournament[] = [];
      for (const t of data) {
        const { count } = await supabase
          .from("tournament_participants")
          .select("*", { count: "exact", head: true })
          .eq("tournament_id", t.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", t.created_by)
          .single();

        tournamentsWithCounts.push({
          ...t,
          participant_count: count ?? 0,
          creator_name: profile?.display_name || "Unknown",
        });
      }
      setTournaments(tournamentsWithCounts);
    }
    setLoading(false);
  }, []);

  const fetchCoins = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("coins")
      .eq("user_id", user.id)
      .single();
    if (data) setUserCoins(data.coins);
  }, [user]);

  const fetchTournamentDetails = useCallback(async (tournamentId: string) => {
    const [tRes, pRes, mRes] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
      supabase.from("tournament_participants").select("*").eq("tournament_id", tournamentId),
      supabase.from("tournament_matches").select("*").eq("tournament_id", tournamentId).order("round").order("match_index"),
    ]);

    if (tRes.data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", tRes.data.created_by)
        .single();
      setActiveTournament({ ...tRes.data, creator_name: profile?.display_name || "Unknown" });
    }

    if (pRes.data) {
      const enriched: TournamentParticipant[] = [];
      for (const p of pRes.data) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", p.user_id)
          .single();
        enriched.push({
          ...p,
          display_name: prof?.display_name || "Player",
          avatar_url: prof?.avatar_url,
        });
      }
      setParticipants(enriched);
    }

    if (mRes.data) {
      const enrichedMatches: TournamentMatch[] = [];
      for (const m of mRes.data) {
        let p1Name = "TBD", p2Name = "TBD";
        if (m.player1_id) {
          const { data: p1 } = await supabase.from("profiles").select("display_name").eq("user_id", m.player1_id).single();
          p1Name = p1?.display_name || "Player";
        }
        if (m.player2_id) {
          const { data: p2 } = await supabase.from("profiles").select("display_name").eq("user_id", m.player2_id).single();
          p2Name = p2?.display_name || "Player";
        }
        enrichedMatches.push({ ...m, player1_name: p1Name, player2_name: p2Name });
      }
      setMatches(enrichedMatches);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
    fetchCoins();
  }, [fetchTournaments, fetchCoins]);

  useEffect(() => {
    if (!activeTournament) return;

    const channel = supabase
      .channel(`tournament-${activeTournament.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments", filter: `id=eq.${activeTournament.id}` }, () => {
        fetchTournamentDetails(activeTournament.id);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_matches", filter: `tournament_id=eq.${activeTournament.id}` }, () => {
        fetchTournamentDetails(activeTournament.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTournament?.id, fetchTournamentDetails]);

  // Create tournament — deduct coins via edge function
  const createTournament = useCallback(async (name: string, entryFee: number) => {
    if (!user) { toast("Sign in first"); return null; }
    if (userCoins < entryFee) { toast("Not enough coins!"); return null; }

    // Deduct entry fee server-side
    const { data: deductResult, error: deductErr } = await supabase.functions.invoke("economy", {
      body: { action: "deduct_coins", amount: entryFee },
    });
    if (deductErr || deductResult?.error) {
      toast(deductResult?.error || "Failed to deduct coins");
      return null;
    }

    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name,
        entry_fee: entryFee,
        prize_pool: entryFee,
        max_players: 8,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      // Refund via edge function
      await supabase.functions.invoke("economy", {
        body: { action: "award_coins", target_user_id: user.id, amount: entryFee },
      });
      toast("Failed to create tournament");
      return null;
    }

    await supabase.from("tournament_participants").insert({ tournament_id: data.id, user_id: user.id, seed: 1 });

    setUserCoins((c) => c - entryFee);
    toast("🏆 Tournament created! Share with friends.");
    await fetchTournaments();
    return data.id;
  }, [user, userCoins, fetchTournaments]);

  // Join tournament
  const joinTournament = useCallback(async (tournamentId: string) => {
    if (!user) { toast("Sign in first"); return false; }

    const { data: t } = await supabase.from("tournaments").select("*").eq("id", tournamentId).single();
    if (!t || t.status !== "open") { toast("Tournament not available"); return false; }
    if (userCoins < t.entry_fee) { toast(`Need ${t.entry_fee} coins to enter!`); return false; }

    const { data: existing } = await supabase
      .from("tournament_participants")
      .select("id")
      .eq("tournament_id", tournamentId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) { toast("Already joined!"); return false; }

    const { count } = await supabase
      .from("tournament_participants")
      .select("*", { count: "exact", head: true })
      .eq("tournament_id", tournamentId);
    const seed = (count ?? 0) + 1;

    // Deduct fee server-side
    const { data: deductResult, error: deductErr } = await supabase.functions.invoke("economy", {
      body: { action: "deduct_coins", amount: t.entry_fee },
    });
    if (deductErr || deductResult?.error) {
      toast(deductResult?.error || "Failed to deduct coins");
      return false;
    }

    const { error } = await supabase
      .from("tournament_participants")
      .insert({ tournament_id: tournamentId, user_id: user.id, seed });

    if (error) {
      await supabase.functions.invoke("economy", {
        body: { action: "award_coins", target_user_id: user.id, amount: t.entry_fee },
      });
      toast("Failed to join");
      return false;
    }

    await supabase
      .from("tournaments")
      .update({ prize_pool: t.prize_pool + t.entry_fee })
      .eq("id", tournamentId);

    setUserCoins((c) => c - t.entry_fee);
    toast("✅ Joined tournament!");
    await fetchTournaments();

    if (seed >= t.max_players) {
      await startTournament(tournamentId);
    }

    return true;
  }, [user, userCoins, fetchTournaments]);

  const startTournament = useCallback(async (tournamentId: string) => {
    const { data: parts } = await supabase
      .from("tournament_participants")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("seed");

    if (!parts || parts.length < 2) { toast("Need at least 2 players"); return; }

    const shuffled = [...parts].sort(() => Math.random() - 0.5);

    const matchInserts: any[] = [];
    for (let i = 0; i < Math.floor(shuffled.length / 2); i++) {
      matchInserts.push({
        tournament_id: tournamentId,
        round: 1,
        match_index: i,
        player1_id: shuffled[i * 2].user_id,
        player2_id: shuffled[i * 2 + 1]?.user_id || null,
        room_code: generateRoomCode(),
        status: shuffled[i * 2 + 1] ? "ready" : "bye",
      });
    }

    if (shuffled.length % 2 === 1) {
      const lastIdx = matchInserts.length - 1;
      if (matchInserts[lastIdx] && !matchInserts[lastIdx].player2_id) {
        matchInserts[lastIdx].winner_id = matchInserts[lastIdx].player1_id;
        matchInserts[lastIdx].status = "bye";
      }
    }

    const totalRounds = Math.ceil(Math.log2(shuffled.length));
    let matchesInRound = Math.floor(shuffled.length / 2);
    for (let round = 2; round <= totalRounds; round++) {
      matchesInRound = Math.ceil(matchesInRound / 2);
      for (let i = 0; i < matchesInRound; i++) {
        matchInserts.push({
          tournament_id: tournamentId,
          round,
          match_index: i,
          player1_id: null,
          player2_id: null,
          room_code: generateRoomCode(),
          status: "pending",
        });
      }
    }

    await supabase.from("tournament_matches").insert(matchInserts);
    await supabase
      .from("tournaments")
      .update({ status: "in_progress", current_round: 1, started_at: new Date().toISOString() })
      .eq("id", tournamentId);

    for (const m of matchInserts) {
      if (m.status === "bye" && m.player1_id) {
        await advanceWinner(tournamentId, 1, m.match_index, m.player1_id);
      }
    }

    toast("🏟️ Tournament started!");
  }, []);

  const reportResult = useCallback(async (matchId: string, winnerId: string) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    await supabase
      .from("tournament_matches")
      .update({ winner_id: winnerId, status: "finished", finished_at: new Date().toISOString() })
      .eq("id", matchId);

    const loserId = match.player1_id === winnerId ? match.player2_id : match.player1_id;
    if (loserId) {
      await supabase
        .from("tournament_participants")
        .update({ eliminated: true })
        .eq("tournament_id", match.tournament_id)
        .eq("user_id", loserId);
    }

    await advanceWinner(match.tournament_id, match.round, match.match_index, winnerId);
    await fetchTournamentDetails(match.tournament_id);
  }, [matches, fetchTournamentDetails]);

  const advanceWinner = async (tournamentId: string, round: number, matchIndex: number, winnerId: string) => {
    const nextRound = round + 1;
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const isPlayer1 = matchIndex % 2 === 0;

    const { data: nextMatch } = await supabase
      .from("tournament_matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .eq("round", nextRound)
      .eq("match_index", nextMatchIndex)
      .maybeSingle();

    if (nextMatch) {
      const update: Record<string, unknown> = {};
      if (isPlayer1) update.player1_id = winnerId;
      else update.player2_id = winnerId;

      const otherPlayer = isPlayer1 ? nextMatch.player2_id : nextMatch.player1_id;
      if (otherPlayer) update.status = "ready";

      await supabase
        .from("tournament_matches")
        .update(update)
        .eq("id", nextMatch.id);
    } else {
      // Final — award prize via edge function
      const { data: t } = await supabase.from("tournaments").select("prize_pool").eq("id", tournamentId).single();

      await supabase
        .from("tournaments")
        .update({ winner_id: winnerId, status: "finished", finished_at: new Date().toISOString() })
        .eq("id", tournamentId);

      if (t) {
        await supabase.functions.invoke("economy", {
          body: { action: "award_coins", target_user_id: winnerId, amount: t.prize_pool },
        });
      }

      toast("🏆 Tournament complete! Winner crowned!");
    }
  };

  const isUserInTournament = useCallback((tournamentId: string) => {
    if (!user) return false;
    return participants.some((p) => p.tournament_id === tournamentId && p.user_id === user.id);
  }, [user, participants]);

  const getUserMatch = useCallback(() => {
    if (!user || !activeTournament) return null;
    return matches.find(
      (m) =>
        m.status === "ready" &&
        (m.player1_id === user.id || m.player2_id === user.id)
    );
  }, [user, activeTournament, matches]);

  return {
    tournaments, activeTournament, participants, matches,
    loading, userCoins,
    fetchTournaments, fetchTournamentDetails,
    createTournament, joinTournament, reportResult,
    isUserInTournament, getUserMatch,
    setActiveTournament,
  };
}
