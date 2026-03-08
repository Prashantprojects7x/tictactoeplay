import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, CheckCircle2, Coins, Zap, Star, Crown, Sparkles } from "lucide-react";
import { useBattlePass } from "@/hooks/useBattlePass";
import { BATTLE_PASS_TIERS } from "@/components/game/battlePassData";
import { useAuth } from "@/contexts/AuthContext";

const rarityStyles: Record<string, string> = {
  common: "border-muted-foreground/30 bg-secondary/50",
  rare: "border-blue-500/50 bg-blue-500/10",
  epic: "border-purple-500/50 bg-purple-500/10",
  legendary: "border-[hsl(var(--gold))]/50 bg-[hsl(var(--gold))]/10",
};

const rarityGlow: Record<string, string> = {
  common: "",
  rare: "shadow-blue-500/20 shadow-lg",
  epic: "shadow-purple-500/20 shadow-lg",
  legendary: "shadow-[hsl(var(--gold))]/30 shadow-xl",
};

export default function BattlePass() {
  const { user } = useAuth();
  const {
    owned, currentTier, xpProgress, coins, loading,
    purchase, TOTAL_TIERS, XP_PER_TIER, BATTLE_PASS_COST,
  } = useBattlePass();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const xpPercent = owned ? Math.min((xpProgress / XP_PER_TIER) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back to Game</span>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-[hsl(var(--gold))]" />
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              BATTLE PASS
            </h1>
            <Sparkles className="w-6 h-6 text-[hsl(var(--gold))]" />
          </div>
          <p className="text-muted-foreground text-sm">Season 1 • {TOTAL_TIERS} Tiers of Rewards</p>
        </motion.div>

        {/* Purchase / Status Card */}
        {!owned ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 mb-8 text-center"
          >
            <Crown className="w-12 h-12 text-[hsl(var(--gold))] mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-1">Unlock the Battle Pass</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Earn exclusive avatars, coins, and rewards by playing games!
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Coins className="w-5 h-5 text-[hsl(var(--gold))]" />
              <span className="text-2xl font-extrabold font-mono">{BATTLE_PASS_COST.toLocaleString()}</span>
              <span className="text-muted-foreground text-sm">coins</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              You have <span className="font-bold text-foreground">{coins.toLocaleString()}</span> coins
            </p>
            {!user ? (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all active:scale-95"
              >
                Sign in to Purchase
              </Link>
            ) : (
              <button
                onClick={purchase}
                disabled={coins < BATTLE_PASS_COST}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-amber-600 text-black px-6 py-3 rounded-xl font-bold hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                {coins < BATTLE_PASS_COST ? "Not Enough Coins" : "Purchase Battle Pass"}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-[hsl(var(--gold))]/30 rounded-2xl p-5 mb-8"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[hsl(var(--gold))]" />
                <span className="font-bold">Tier {currentTier} / {TOTAL_TIERS}</span>
              </div>
              <span className="text-sm text-muted-foreground font-mono">
                {xpProgress} / {XP_PER_TIER} XP
              </span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--gold))] to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            {currentTier >= TOTAL_TIERS && (
              <p className="text-center text-[hsl(var(--gold))] font-bold mt-2 text-sm">
                ✨ Battle Pass Complete! ✨
              </p>
            )}
          </motion.div>
        )}

        {/* Tier List */}
        <div className="space-y-3">
          {BATTLE_PASS_TIERS.map((tier, i) => {
            const unlocked = owned && currentTier >= tier.tier;
            const isNext = owned && currentTier === tier.tier - 1;

            return (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border transition-all
                  ${unlocked
                    ? `${rarityStyles[tier.rarity]} ${rarityGlow[tier.rarity]}`
                    : isNext
                      ? "border-primary/50 bg-primary/5"
                      : "border-border/30 bg-card/50 opacity-60"
                  }
                `}
              >
                {/* Tier Number */}
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-sm shrink-0
                  ${unlocked ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}
                `}>
                  {tier.tier}
                </div>

                {/* Icon */}
                <span className="text-2xl">{tier.icon}</span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{tier.reward}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {tier.rarity}
                  </p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  ) : !owned ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
