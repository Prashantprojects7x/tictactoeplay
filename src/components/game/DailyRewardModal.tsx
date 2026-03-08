import { motion, AnimatePresence } from "framer-motion";
import { Gift, Flame, Coins, X, Check } from "lucide-react";
import { useDailyReward } from "@/hooks/useDailyReward";
import { toast } from "sonner";

const DAILY_REWARDS = [10, 20, 30, 40, 50, 75, 150];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DailyRewardModal() {
  const {
    canClaim, currentStreak, claiming, showModal, lastClaimResult,
    claim, dismissModal,
  } = useDailyReward();

  if (!showModal) return null;

  const handleClaim = async () => {
    const result = await claim();
    if (result) {
      toast(`🎁 +${result.coins_awarded} coins! Day ${result.current_streak} streak!`);
      setTimeout(dismissModal, 2000);
    } else {
      toast("Failed to claim reward");
    }
  };

  const nextDay = currentStreak + 1;
  const claimed = !!lastClaimResult;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={dismissModal}
      >
        <motion.div
          className="relative w-[360px] max-w-[92vw] rounded-2xl border border-border bg-card p-6 shadow-2xl"
          initial={{ scale: 0.85, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.85, y: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={dismissModal}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20">
              <Gift className="text-primary" size={28} />
            </div>
            <h2 className="text-xl font-bold text-foreground font-[Outfit]">Daily Reward</h2>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Flame size={14} className="text-[hsl(var(--streak))]" />
              <span>{currentStreak} day streak</span>
            </div>
          </div>

          {/* 7-day grid */}
          <div className="grid grid-cols-7 gap-1.5 mb-5">
            {DAILY_REWARDS.map((reward, i) => {
              const day = i + 1;
              const isPast = day <= currentStreak;
              const isToday = day === nextDay;
              const isFuture = day > nextDay;

              return (
                <div
                  key={day}
                  className={`flex flex-col items-center rounded-lg p-1.5 text-center transition-all ${
                    isPast
                      ? "bg-primary/15 border border-primary/30"
                      : isToday
                      ? "bg-accent/15 border-2 border-accent ring-2 ring-accent/20"
                      : "bg-secondary/50 border border-border/50 opacity-60"
                  }`}
                >
                  <span className="text-[10px] font-medium text-muted-foreground">{DAY_LABELS[i]}</span>
                  <div className="my-0.5">
                    {isPast ? (
                      <Check size={14} className="text-primary" />
                    ) : (
                      <Coins size={14} className={isToday ? "text-accent" : "text-muted-foreground"} />
                    )}
                  </div>
                  <span className={`text-xs font-bold ${isPast ? "text-primary" : isToday ? "text-accent" : "text-muted-foreground"}`}>
                    {reward}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Today's reward highlight */}
          {!claimed && canClaim && (
            <div className="mb-4 rounded-xl bg-accent/10 border border-accent/20 p-3 text-center">
              <p className="text-sm text-muted-foreground">Today's reward</p>
              <p className="text-2xl font-bold text-accent font-[Outfit]">
                +{DAILY_REWARDS[(nextDay - 1) % 7]} coins
              </p>
            </div>
          )}

          {/* Claimed result */}
          {claimed && lastClaimResult && (
            <motion.div
              className="mb-4 rounded-xl bg-primary/10 border border-primary/20 p-3 text-center"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <p className="text-sm text-muted-foreground">Claimed!</p>
              <p className="text-2xl font-bold text-primary font-[Outfit]">
                +{lastClaimResult.coins} coins 🎉
              </p>
            </motion.div>
          )}

          {/* CTA */}
          {!claimed ? (
            <button
              onClick={handleClaim}
              disabled={claiming || !canClaim}
              className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:brightness-110 disabled:opacity-50"
            >
              {claiming ? "Claiming..." : "Claim Reward"}
            </button>
          ) : (
            <button
              onClick={dismissModal}
              className="w-full rounded-xl bg-secondary py-3 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80"
            >
              Continue Playing
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
