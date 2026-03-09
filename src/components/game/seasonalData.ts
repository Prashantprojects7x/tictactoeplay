import type { BoardTheme } from "./types";

// Seasonal board themes (extend the base themes)
export const SEASONAL_THEMES: Record<string, { label: string; accent: string; cellBg: string }> = {
  spring: { label: "🌸 Spring Blossom", accent: "340 80% 65%", cellBg: "340 15% 14%" },
  summer: { label: "☀️ Summer Inferno", accent: "35 100% 55%", cellBg: "25 20% 14%" },
  autumn: { label: "🍂 Autumn Harvest", accent: "30 85% 50%", cellBg: "20 18% 12%" },
  winter: { label: "❄️ Winter Frost", accent: "200 80% 70%", cellBg: "210 25% 12%" },
};

// Seasonal mark colors for themed boards
export const SEASONAL_MARK_COLORS: Record<string, { x: [string, string]; o: [string, string]; xGlow: string; oGlow: string }> = {
  spring: {
    x: ["hsl(340,80%,68%)", "hsl(320,75%,65%)"],
    o: ["hsl(140,70%,55%)", "hsl(160,65%,50%)"],
    xGlow: "hsl(340,80%,58%)",
    oGlow: "hsl(140,70%,48%)",
  },
  summer: {
    x: ["hsl(35,100%,60%)", "hsl(15,100%,55%)"],
    o: ["hsl(195,100%,55%)", "hsl(215,100%,50%)"],
    xGlow: "hsl(35,100%,50%)",
    oGlow: "hsl(195,100%,48%)",
  },
  autumn: {
    x: ["hsl(30,85%,55%)", "hsl(10,80%,50%)"],
    o: ["hsl(50,90%,55%)", "hsl(40,85%,50%)"],
    xGlow: "hsl(30,85%,45%)",
    oGlow: "hsl(50,90%,45%)",
  },
  winter: {
    x: ["hsl(200,80%,72%)", "hsl(220,75%,68%)"],
    o: ["hsl(280,60%,70%)", "hsl(300,55%,65%)"],
    xGlow: "hsl(200,80%,60%)",
    oGlow: "hsl(280,60%,58%)",
  },
};

export interface SeasonalEvent {
  id: string;
  name: string;
  slug: string;
  description: string;
  season_type: string;
  theme_id: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  rewards: SeasonalReward[];
}

export interface SeasonalReward {
  type: "avatar" | "theme" | "title" | "coins";
  value: string | number;
  name: string;
  target: number; // total wins needed
}

export interface SeasonalChallengeProgress {
  id: string;
  user_id: string;
  event_id: string;
  challenge_type: string;
  challenge_id: string;
  progress: number;
  target: number;
  completed: boolean;
  reward_claimed: boolean;
  last_updated: string;
}

// Challenges generated per event
export interface SeasonalChallenge {
  id: string;
  type: "win_count" | "daily_wins" | "streak";
  name: string;
  description: string;
  target: number;
  reward_type: "coins" | "avatar" | "theme" | "title";
  reward_value: string | number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export function getSeasonalChallenges(seasonType: string): SeasonalChallenge[] {
  const seasonEmoji = { spring: "🌸", summer: "☀️", fall: "🍂", winter: "❄️", custom: "🎉" }[seasonType] || "🎉";

  return [
    // Win-count challenges
    { id: `${seasonType}_win_5`, type: "win_count", name: "First Steps", description: "Win 5 games this season", target: 5, reward_type: "coins", reward_value: 50, icon: "🎯", rarity: "common" },
    { id: `${seasonType}_win_15`, type: "win_count", name: "Rising Star", description: "Win 15 games this season", target: 15, reward_type: "coins", reward_value: 150, icon: "⭐", rarity: "rare" },
    { id: `${seasonType}_win_30`, type: "win_count", name: `${seasonEmoji} Season Master`, description: "Win 30 games this season", target: 30, reward_type: "avatar", reward_value: seasonEmoji, icon: "👑", rarity: "epic" },
    { id: `${seasonType}_win_50`, type: "win_count", name: "Unstoppable", description: "Win 50 games this season", target: 50, reward_type: "coins", reward_value: 500, icon: "🏆", rarity: "legendary" },

    // Daily challenges
    { id: `${seasonType}_daily_3`, type: "daily_wins", name: "Daily Grind", description: "Win 3 games in a single day", target: 3, reward_type: "coins", reward_value: 30, icon: "📅", rarity: "common" },
    { id: `${seasonType}_daily_5`, type: "daily_wins", name: "Day Warrior", description: "Win 5 games in a single day", target: 5, reward_type: "coins", reward_value: 75, icon: "⚔️", rarity: "rare" },
    { id: `${seasonType}_daily_10`, type: "daily_wins", name: "Marathon Runner", description: "Win 10 games in a single day", target: 10, reward_type: "coins", reward_value: 200, icon: "🏃", rarity: "epic" },

    // Streak challenges
    { id: `${seasonType}_streak_3`, type: "streak", name: "Hot Hands", description: "Achieve a 3-win streak", target: 3, reward_type: "coins", reward_value: 40, icon: "🔥", rarity: "common" },
    { id: `${seasonType}_streak_5`, type: "streak", name: "On Fire", description: "Achieve a 5-win streak", target: 5, reward_type: "coins", reward_value: 100, icon: "💥", rarity: "rare" },
    { id: `${seasonType}_streak_10`, type: "streak", name: "Legendary Streak", description: "Achieve a 10-win streak", target: 10, reward_type: "coins", reward_value: 300, icon: "🌟", rarity: "legendary" },
  ];
}

export function getSeasonBackground(seasonType: string): string {
  switch (seasonType) {
    case "spring": return "from-pink-950/30 via-background to-green-950/20";
    case "summer": return "from-amber-950/30 via-background to-orange-950/20";
    case "fall": return "from-orange-950/30 via-background to-yellow-950/20";
    case "winter": return "from-blue-950/30 via-background to-cyan-950/20";
    default: return "from-primary/10 via-background to-accent/10";
  }
}

export function getSeasonGradient(seasonType: string): string {
  switch (seasonType) {
    case "spring": return "from-pink-400 to-rose-500";
    case "summer": return "from-amber-400 to-orange-500";
    case "fall": return "from-orange-400 to-yellow-600";
    case "winter": return "from-blue-300 to-cyan-500";
    default: return "from-primary to-accent";
  }
}
