import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Gift, Trophy, Flame, Star, Calendar, Lock, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSeasonalEvents } from "@/hooks/useSeasonalEvents";
import { getSeasonBackground, getSeasonGradient } from "@/components/game/seasonalData";
import { useState, useEffect } from "react";

const RARITY_COLORS: Record<string, string> = {
  common: "border-muted-foreground/30 bg-muted/30",
  rare: "border-blue-500/40 bg-blue-950/30",
  epic: "border-purple-500/40 bg-purple-950/30",
  legendary: "border-yellow-500/40 bg-yellow-950/30",
};

const RARITY_BADGE: Record<string, string> = {
  common: "bg-muted-foreground/20 text-muted-foreground",
  rare: "bg-blue-500/20 text-blue-400",
  epic: "bg-purple-500/20 text-purple-400",
  legendary: "bg-yellow-500/20 text-yellow-400",
};

const CHALLENGE_ICONS: Record<string, React.ReactNode> = {
  win_count: <Trophy className="h-4 w-4" />,
  daily_wins: <Calendar className="h-4 w-4" />,
  streak: <Flame className="h-4 w-4" />,
};

function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="flex gap-2">
      {[
        { val: timeLeft.days, label: "Days" },
        { val: timeLeft.hours, label: "Hrs" },
        { val: timeLeft.minutes, label: "Min" },
        { val: timeLeft.seconds, label: "Sec" },
      ].map(({ val, label }) => (
        <div key={label} className="flex flex-col items-center">
          <motion.div
            className="w-12 h-12 rounded-lg bg-secondary/60 border border-border flex items-center justify-center font-mono text-lg font-bold text-foreground"
            key={val}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {String(val).padStart(2, "0")}
          </motion.div>
          <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Seasons() {
  const navigate = useNavigate();
  const { currentEvent, challenges, getChallengeProgress, claimReward, loading } = useSeasonalEvents();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "win_count" | "daily_wins" | "streak">("all");

  const filteredChallenges = filter === "all" ? challenges : challenges.filter((c) => c.type === filter);

  const totalChallenges = challenges.length;
  const completedChallenges = challenges.filter((c) => getChallengeProgress(c.id)?.completed).length;

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    await claimReward(id);
    setClaimingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6">
        <Calendar className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="text-2xl font-bold text-foreground">No Active Season</h1>
        <p className="text-muted-foreground text-center max-w-md">
          There's no seasonal event running right now. Check back soon for the next season with exclusive rewards and challenges!
        </p>
        <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Game
        </Button>
      </div>
    );
  }

  const seasonBg = getSeasonBackground(currentEvent.season_type);
  const seasonGradient = getSeasonGradient(currentEvent.season_type);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${seasonBg} p-4 pb-24`}>
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-foreground/70 hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{currentEvent.name}</h1>
            <p className="text-sm text-muted-foreground">{currentEvent.description}</p>
          </div>
        </div>

        {/* Season Banner */}
        <motion.div
          className={`rounded-2xl border border-border/50 bg-gradient-to-r ${seasonGradient} p-[1px] mb-6`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="rounded-2xl bg-card/90 backdrop-blur-sm p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Time Remaining</span>
              </div>
              <CountdownTimer endDate={currentEvent.end_date} />
            </div>

            {/* Overall Progress */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Season Progress</span>
                <span className="font-bold text-foreground">{completedChallenges}/{totalChallenges}</span>
              </div>
              <Progress value={(completedChallenges / totalChallenges) * 100} className="h-2.5" />
            </div>
          </div>
        </motion.div>

        {/* Seasonal Rewards Track */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Season Rewards
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {(currentEvent.rewards || []).map((reward, i) => {
              const earned = completedChallenges >= (i + 1) * 2; // Rough approximation
              return (
                <motion.div
                  key={i}
                  className={`flex-shrink-0 w-24 rounded-xl border p-3 text-center transition-all ${
                    earned
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/30 bg-card/50 opacity-60"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl mb-1">{typeof reward.value === "string" ? reward.value : "🪙"}</div>
                  <div className="text-[10px] font-medium text-foreground truncate">{reward.name}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {earned ? "✅ Earned" : `${reward.target} wins`}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[
            { key: "all", label: "All", icon: <Star className="h-3.5 w-3.5" /> },
            { key: "win_count", label: "Wins", icon: <Trophy className="h-3.5 w-3.5" /> },
            { key: "daily_wins", label: "Daily", icon: <Calendar className="h-3.5 w-3.5" /> },
            { key: "streak", label: "Streak", icon: <Flame className="h-3.5 w-3.5" /> },
          ].map(({ key, label, icon }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key as typeof filter)}
              className="gap-1.5 text-xs"
            >
              {icon} {label}
            </Button>
          ))}
        </div>

        {/* Challenges List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredChallenges.map((challenge, i) => {
              const prog = getChallengeProgress(challenge.id);
              const progressVal = prog?.progress || 0;
              const isCompleted = prog?.completed || false;
              const isClaimed = prog?.reward_claimed || false;
              const percent = Math.min(100, (progressVal / challenge.target) * 100);

              return (
                <motion.div
                  key={challenge.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border p-4 transition-all ${
                    isClaimed
                      ? "border-primary/20 bg-primary/5 opacity-70"
                      : isCompleted
                      ? "border-primary/40 bg-primary/10"
                      : RARITY_COLORS[challenge.rarity]
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      isCompleted ? "bg-primary/20" : "bg-secondary/60"
                    }`}>
                      {challenge.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm text-foreground">{challenge.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase ${RARITY_BADGE[challenge.rarity]}`}>
                          {challenge.rarity}
                        </span>
                        <span className="text-muted-foreground/60">
                          {CHALLENGE_ICONS[challenge.type]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <Progress value={percent} className="h-2 flex-1" />
                        <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                          {progressVal}/{challenge.target}
                        </span>
                      </div>
                    </div>

                    {/* Reward / Claim */}
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="text-xs font-medium text-foreground/70">
                        {challenge.reward_type === "coins" ? `🪙 ${challenge.reward_value}` : `${challenge.reward_value}`}
                      </div>
                      {isClaimed ? (
                        <span className="text-[10px] text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Claimed
                        </span>
                      ) : isCompleted ? (
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3"
                          onClick={() => handleClaim(challenge.id)}
                          disabled={claimingId === challenge.id}
                        >
                          <Gift className="h-3 w-3 mr-1" />
                          {claimingId === challenge.id ? "..." : "Claim"}
                        </Button>
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground/30" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
