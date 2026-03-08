import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Trophy, Users, Coins, Swords, Crown, Plus,
  ChevronRight, Zap, Shield, Clock, Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTournament } from "@/hooks/useTournament";
import type { TournamentMatch } from "@/hooks/useTournament";

// ─── Bracket Match Card ──────────────────────────────────────
function MatchCard({
  match, isUserMatch, onPlay,
}: {
  match: TournamentMatch;
  isUserMatch: boolean;
  onPlay: () => void;
}) {
  const p1Won = match.winner_id === match.player1_id;
  const p2Won = match.winner_id === match.player2_id;

  return (
    <div className={`
      rounded-xl border p-3 w-56 transition-all
      ${match.status === "finished" ? "border-border/30 bg-card/30" :
        isUserMatch ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" :
        match.status === "ready" ? "border-accent/30 bg-accent/5" :
        "border-border/20 bg-card/20 opacity-60"}
    `}>
      {/* Player 1 */}
      <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg mb-1 ${p1Won ? "bg-accent/10" : ""}`}>
        <span className={`text-xs font-semibold truncate ${p1Won ? "text-accent" : match.player1_id ? "text-foreground" : "text-muted-foreground/40"}`}>
          {match.player1_name || "TBD"}
        </span>
        {p1Won && <Crown className="w-3 h-3 text-[hsl(var(--gold))]" />}
      </div>

      <div className="h-px bg-border/30 mx-2" />

      {/* Player 2 */}
      <div className={`flex items-center justify-between py-1.5 px-2 rounded-lg mt-1 ${p2Won ? "bg-accent/10" : ""}`}>
        <span className={`text-xs font-semibold truncate ${p2Won ? "text-accent" : match.player2_id ? "text-foreground" : "text-muted-foreground/40"}`}>
          {match.player2_name || "TBD"}
        </span>
        {p2Won && <Crown className="w-3 h-3 text-[hsl(var(--gold))]" />}
      </div>

      {/* Play button */}
      {isUserMatch && match.status === "ready" && (
        <button
          onClick={onPlay}
          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
        >
          <Swords className="w-3.5 h-3.5" /> Play Match
        </button>
      )}

      {match.status === "bye" && (
        <div className="mt-2 text-center text-[10px] text-muted-foreground font-medium">BYE</div>
      )}
    </div>
  );
}

// ─── Main Tournament Page ──────────────────────────────────────
export default function Tournament() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    tournaments, activeTournament, participants, matches,
    loading, userCoins,
    fetchTournaments, fetchTournamentDetails,
    createTournament, joinTournament, reportResult,
    isUserInTournament, getUserMatch,
    setActiveTournament,
  } = useTournament();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFee, setNewFee] = useState(50);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createTournament(newName.trim(), newFee);
    if (id) {
      setShowCreate(false);
      setNewName("");
      fetchTournamentDetails(id);
    }
  };

  const handlePlayMatch = (match: TournamentMatch) => {
    if (!match.room_code) return;
    // Navigate to game with the room code
    navigate(`/?join=${match.room_code}&tournament=${activeTournament?.id}&matchId=${match.id}`);
  };

  // Determine rounds for bracket
  const rounds = matches.reduce((acc, m) => {
    if (!acc[m.round]) acc[m.round] = [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  const roundLabels = (round: number, totalRounds: number) => {
    if (round === totalRounds) return "Finals";
    if (round === totalRounds - 1) return "Semi-Finals";
    if (round === totalRounds - 2) return "Quarter-Finals";
    return `Round ${round}`;
  };

  const totalRounds = Object.keys(rounds).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium text-sm">Back to Game</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Coins className="w-4 h-4 text-[hsl(var(--gold))]" />
            <span className="font-bold font-mono">{userCoins.toLocaleString()}</span>
          </div>
        </div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-[hsl(var(--gold))]" />
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              TOURNAMENTS
            </h1>
            <Trophy className="w-6 h-6 text-[hsl(var(--gold))]" />
          </div>
          <p className="text-muted-foreground text-sm">8-Player elimination brackets • Win the prize pool!</p>
        </motion.div>

        {/* Detail View */}
        {activeTournament ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={() => setActiveTournament(null)}
              className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Back to list
            </button>

            {/* Tournament Info Card */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">{activeTournament.name}</h2>
                <span className={`
                  text-[10px] font-bold uppercase px-3 py-1 rounded-full
                  ${activeTournament.status === "open" ? "bg-accent/20 text-accent" :
                    activeTournament.status === "in_progress" ? "bg-primary/20 text-primary" :
                    "bg-[hsl(var(--gold))]/20 text-[hsl(var(--gold))]"}
                `}>
                  {activeTournament.status === "in_progress" ? "Live" : activeTournament.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold font-mono text-[hsl(var(--gold))]">{activeTournament.prize_pool}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Prize Pool</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono">{participants.length}/{activeTournament.max_players}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Players</p>
                </div>
                <div>
                  <p className="text-lg font-bold font-mono">{activeTournament.entry_fee}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Entry Fee</p>
                </div>
              </div>

              {/* Join button if open */}
              {activeTournament.status === "open" && user && !isUserInTournament(activeTournament.id) && (
                <button
                  onClick={() => joinTournament(activeTournament.id).then(() => fetchTournamentDetails(activeTournament.id))}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-bold text-sm hover:brightness-110 active:scale-95 transition-all"
                >
                  <Zap className="w-4 h-4" /> Join for {activeTournament.entry_fee} coins
                </button>
              )}

              {/* Winner */}
              {activeTournament.status === "finished" && activeTournament.winner_id && (
                <div className="mt-4 text-center bg-[hsl(var(--gold))]/10 rounded-xl p-4">
                  <Crown className="w-8 h-8 text-[hsl(var(--gold))] mx-auto mb-1" />
                  <p className="text-sm font-bold">
                    Winner: {participants.find((p) => p.user_id === activeTournament.winner_id)?.display_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prize: {activeTournament.prize_pool} coins
                  </p>
                </div>
              )}
            </div>

            {/* Participants */}
            {activeTournament.status === "open" && (
              <div className="mb-6">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" /> Players ({participants.length}/{activeTournament.max_players})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {participants.map((p) => (
                    <div key={p.id} className="bg-card border border-border/30 rounded-xl p-3 flex items-center gap-2">
                      <span className="text-lg">{p.avatar_url || "🎮"}</span>
                      <span className="text-xs font-semibold truncate">{p.display_name}</span>
                    </div>
                  ))}
                  {Array.from({ length: activeTournament.max_players - participants.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-card/30 border border-dashed border-border/20 rounded-xl p-3 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/40">Waiting...</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bracket */}
            {(activeTournament.status === "in_progress" || activeTournament.status === "finished") && totalRounds > 0 && (
              <div>
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-primary" /> Bracket
                </h3>
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-8 min-w-max">
                    {Object.entries(rounds)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([round, roundMatches]) => (
                        <div key={round} className="flex flex-col gap-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center mb-2">
                            {roundLabels(Number(round), totalRounds)}
                          </h4>
                          <div className="flex flex-col gap-6 justify-around flex-1">
                            {roundMatches.map((match) => {
                              const isUserMatch = user ? (match.player1_id === user.id || match.player2_id === user.id) : false;
                              return (
                                <MatchCard
                                  key={match.id}
                                  match={match}
                                  isUserMatch={isUserMatch}
                                  onPlay={() => handlePlayMatch(match)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* Tournament List */
          <div>
            {/* Create button */}
            {user && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                {!showCreate ? (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full bg-card border-2 border-dashed border-border/50 rounded-2xl p-5 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold text-sm">Create Tournament</span>
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-2xl p-5"
                  >
                    <h3 className="font-bold text-sm mb-4">Create New Tournament</h3>
                    <div className="space-y-3">
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Tournament name..."
                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors"
                        maxLength={40}
                      />
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Entry Fee (coins)</label>
                        <div className="flex gap-2">
                          {[25, 50, 100, 200].map((fee) => (
                            <button
                              key={fee}
                              onClick={() => setNewFee(fee)}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                                newFee === fee
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {fee} 🪙
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-secondary/30 rounded-xl p-3 text-xs text-muted-foreground">
                        <p>Prize pool: <span className="text-[hsl(var(--gold))] font-bold">{newFee * 8} coins</span> (8 players × {newFee})</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowCreate(false)}
                          className="flex-1 bg-secondary text-secondary-foreground rounded-xl py-2.5 text-sm font-semibold hover:bg-secondary/80 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreate}
                          disabled={!newName.trim() || userCoins < newFee}
                          className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                        >
                          Create ({newFee} 🪙)
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Tournament list */}
            {tournaments.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No active tournaments</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => fetchTournamentDetails(t.id)}
                    className="bg-card border border-border/50 rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm truncate">{t.name}</h3>
                          <span className={`
                            text-[9px] font-bold uppercase px-2 py-0.5 rounded-full
                            ${t.status === "open" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}
                          `}>
                            {t.status === "in_progress" ? "Live" : t.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {t.participant_count}/{t.max_players}
                          </span>
                          <span className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-[hsl(var(--gold))]" /> {t.entry_fee} entry
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3 text-[hsl(var(--gold))]" /> {t.prize_pool} pool
                          </span>
                          <span>by {t.creator_name}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
