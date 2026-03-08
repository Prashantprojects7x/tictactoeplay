import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, Lock, CheckCircle2, Sparkles, Filter } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/contexts/AuthContext";
import { RARITY_CONFIG, type AchievementRarity } from "@/components/game/achievementsData";

const RARITY_ORDER: AchievementRarity[] = ["common", "rare", "epic", "legendary"];
const FILTER_OPTIONS = ["all", ...RARITY_ORDER] as const;
type FilterOption = (typeof FILTER_OPTIONS)[number];

export default function Achievements() {
  const { user } = useAuth();
  const { achievements, unlocked, loading, isUnlocked, getProgress, checkAndClaim } = useAchievements();
  const [filter, setFilter] = useState<FilterOption>("all");
  const [claimChecked, setClaimChecked] = useState(false);

  // Auto-check for claimable achievements on load
  useEffect(() => {
    if (!loading && user && !claimChecked) {
      checkAndClaim();
      setClaimChecked(true);
    }
  }, [loading, user, claimChecked, checkAndClaim]);

  const filtered = filter === "all" ? achievements : achievements.filter((a) => a.rarity === filter);
  const unlockedCount = unlocked.length;
  const totalCount = achievements.length;
  const overallProgress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="w-full max-w-3xl mb-8">
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
              🏅 Achievements
            </span>
          </h1>
          <p className="text-muted-foreground text-sm">
            {unlockedCount}/{totalCount} unlocked
          </p>
        </motion.div>

        {/* Overall progress bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 max-w-md mx-auto"
        >
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{overallProgress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="w-full max-w-3xl mb-6 flex gap-2 justify-center flex-wrap">
        {FILTER_OPTIONS.map((opt) => {
          const config = opt !== "all" ? RARITY_CONFIG[opt] : null;
          return (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                filter === opt
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {opt === "all" ? (
                <Filter className="w-3 h-3" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {opt === "all" ? "All" : config?.label}
            </button>
          );
        })}
      </div>

      {/* Achievements Grid */}
      <div className="w-full max-w-3xl">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-16 text-muted-foreground">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sign in to track achievements</p>
            <Link to="/auth" className="text-primary text-sm mt-2 inline-block hover:underline">
              Sign In →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No achievements in this category</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((ach, i) => {
                const achieved = isUnlocked(ach.id);
                const progress = getProgress(ach);
                const rarity = RARITY_CONFIG[ach.rarity];

                return (
                  <motion.div
                    key={ach.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                      achieved
                        ? `bg-card ${rarity.border} shadow-lg ${rarity.glow}`
                        : "bg-card/40 border-border/30 opacity-75"
                    }`}
                  >
                    {/* Rarity badge */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-3xl ${achieved ? "" : "grayscale opacity-50"}`}>
                          {ach.icon}
                        </span>
                        <div>
                          <h3 className="font-semibold text-sm leading-tight">{ach.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{ach.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r ${rarity.gradient} text-white`}
                        >
                          {rarity.label}
                        </span>
                        {achieved ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{achieved ? "Completed" : `${progress}%`}</span>
                        <span className="flex items-center gap-0.5">
                          🪙 {ach.coinReward}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${achieved ? 100 : progress}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 + i * 0.02 }}
                          className={`h-full rounded-full ${
                            achieved
                              ? `bg-gradient-to-r ${rarity.gradient}`
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Subtle glow for unlocked */}
                    {achieved && (
                      <div
                        className={`absolute inset-0 pointer-events-none rounded-xl bg-gradient-to-br ${rarity.gradient} opacity-[0.04]`}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Stats summary */}
      {user && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex gap-4 text-center"
        >
          {RARITY_ORDER.map((r) => {
            const total = achievements.filter((a) => a.rarity === r).length;
            const done = achievements.filter((a) => a.rarity === r && isUnlocked(a.id)).length;
            const config = RARITY_CONFIG[r];
            return (
              <div key={r} className="flex flex-col items-center gap-1">
                <span
                  className={`text-lg font-[JetBrains_Mono] font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}
                >
                  {done}/{total}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {config.label}
                </span>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
