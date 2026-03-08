import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trophy, Flame, Clock, Gamepad2, Crown, Coins,
  Target, TrendingUp, Zap, Shield, Award,
} from "lucide-react";
import { getLevelTitle, getLevelColor, xpForLevel } from "@/components/game/progression";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!profile) return null;

  const winRate = profile.total_games > 0 ? Math.round((profile.total_wins / profile.total_games) * 100) : 0;
  const level = profile.level ?? 1;
  const xp = profile.xp ?? 0;
  const xpNeeded = xpForLevel(level);
  const xpPercent = Math.min((xp / xpNeeded) * 100, 100);
  const title = getLevelTitle(level);
  const gradientClass = getLevelColor(level);

  const stats = [
    { icon: Gamepad2, label: "Games Played", value: profile.total_games, color: "text-muted-foreground" },
    { icon: Trophy, label: "Total Wins", value: profile.total_wins, color: "text-primary" },
    { icon: TrendingUp, label: "Win Rate", value: `${winRate}%`, color: "text-accent" },
    { icon: Flame, label: "Current Streak", value: profile.win_streak, color: "text-[hsl(var(--streak))]" },
    { icon: Award, label: "Best Streak", value: profile.max_streak, color: "text-[hsl(var(--gold))]" },
    { icon: Clock, label: "Best Time", value: profile.best_time ? `${(profile.best_time / 1000).toFixed(1)}s` : "—", color: "text-muted-foreground" },
    { icon: Coins, label: "Coins", value: profile.coins, color: "text-[hsl(var(--gold))]" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back to Game</span>
        </Link>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          {/* Avatar */}
          <div className="relative mb-4">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-4xl shadow-xl`}>
              {profile.avatar_url || "🎮"}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gradientClass} text-white shadow-lg`}>
                <Crown className="w-3 h-3" /> Lv.{level}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-extrabold mt-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {profile.display_name || user?.email?.split("@")[0] || "Player"}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>

          {/* XP Bar */}
          <div className="w-full max-w-xs mt-4">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>XP Progress</span>
              <span>{xp} / {xpNeeded}</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${gradientClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          {stats.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="bg-card border border-border/50 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`${color} bg-secondary/80 p-2 rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold font-mono">{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <div className="flex gap-3 justify-center">
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all active:scale-95"
          >
            <Trophy className="w-4 h-4" /> Leaderboard
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-3 rounded-xl font-bold text-sm hover:bg-secondary/80 transition-all active:scale-95"
          >
            <Zap className="w-4 h-4" /> Play Now
          </Link>
        </div>
      </div>
    </div>
  );
}
