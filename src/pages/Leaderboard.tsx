import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Flame, Clock, Gamepad2, Crown, Medal, Award } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_wins: number;
  total_games: number;
  best_time: number | null;
  max_streak: number;
  coins: number;
}

const RANK_ICONS = [Crown, Medal, Award];
const RANK_COLORS = [
  "from-yellow-400 to-amber-600",
  "from-slate-300 to-slate-500",
  "from-amber-600 to-orange-800",
];

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"wins" | "streak" | "coins">("wins");

  const fetchLeaderboard = async () => {
    const orderCol =
      sortBy === "wins" ? "total_wins" : sortBy === "streak" ? "max_streak" : "coins";

    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, total_wins, total_games, best_time, max_streak, coins")
      .order(orderCol, { ascending: false })
      .limit(50);

    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("leaderboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortBy]);

  const winRate = (e: LeaderboardEntry) =>
    e.total_games > 0 ? Math.round((e.total_wins / e.total_games) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-2xl mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back to Game</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-[JetBrains_Mono] text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🏆 Leaderboard
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">Real-time rankings • Updates live</p>
        </motion.div>
      </div>

      {/* Sort Tabs */}
      <div className="w-full max-w-2xl mb-6 flex gap-2 justify-center">
        {([
          { key: "wins", icon: Trophy, label: "Wins" },
          { key: "streak", icon: Flame, label: "Best Streak" },
          { key: "coins", icon: Gamepad2, label: "Coins" },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              sortBy === key
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No players yet</p>
            <p className="text-sm mt-1">Be the first to play!</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {entries.map((entry, i) => {
              const RankIcon = RANK_ICONS[i];
              const isTop3 = i < 3;

              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 px-4 py-3 mb-2 rounded-xl transition-colors ${
                    isTop3
                      ? "bg-card border border-border/60 shadow-md"
                      : "bg-card/50 border border-transparent hover:border-border/40"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    {isTop3 && RankIcon ? (
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br ${RANK_COLORS[i]}`}
                      >
                        <RankIcon className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground font-mono font-bold text-sm">
                        {i + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                    {entry.avatar_url || "🎮"}
                  </div>

                  {/* Name & Stats */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {entry.display_name || "Anonymous"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{entry.total_games} games</span>
                      <span>{winRate(entry)}% win rate</span>
                      {entry.best_time && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {(entry.best_time / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Stat */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-[JetBrains_Mono] font-bold text-lg text-foreground">
                      {sortBy === "wins"
                        ? entry.total_wins
                        : sortBy === "streak"
                        ? entry.max_streak
                        : entry.coins}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {sortBy === "wins" ? "wins" : sortBy === "streak" ? "streak" : "coins"}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Live indicator */}
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        Live updates enabled
      </div>
    </div>
  );
}
