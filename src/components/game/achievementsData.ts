export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  coinReward: number;
  requirement: {
    stat: "total_wins" | "total_games" | "max_streak" | "level" | "coins" | "best_time";
    value: number;
    comparator?: "gte" | "lte"; // default gte
  };
}

export const RARITY_CONFIG: Record<AchievementRarity, { label: string; gradient: string; border: string; glow: string }> = {
  common: {
    label: "Common",
    gradient: "from-zinc-400 to-zinc-600",
    border: "border-zinc-500/40",
    glow: "shadow-zinc-500/20",
  },
  rare: {
    label: "Rare",
    gradient: "from-blue-400 to-cyan-500",
    border: "border-blue-500/40",
    glow: "shadow-blue-500/20",
  },
  epic: {
    label: "Epic",
    gradient: "from-purple-400 to-pink-500",
    border: "border-purple-500/40",
    glow: "shadow-purple-500/20",
  },
  legendary: {
    label: "Legendary",
    gradient: "from-amber-400 to-orange-500",
    border: "border-amber-500/40",
    glow: "shadow-amber-500/30",
  },
};

export const ACHIEVEMENTS: Achievement[] = [
  // Wins
  { id: "first_win", name: "First Blood", description: "Win your first game", icon: "⚔️", rarity: "common", coinReward: 10, requirement: { stat: "total_wins", value: 1 } },
  { id: "wins_5", name: "Getting Started", description: "Win 5 games", icon: "🎯", rarity: "common", coinReward: 25, requirement: { stat: "total_wins", value: 5 } },
  { id: "wins_10", name: "Competitor", description: "Win 10 games", icon: "🏅", rarity: "common", coinReward: 50, requirement: { stat: "total_wins", value: 10 } },
  { id: "wins_25", name: "Veteran", description: "Win 25 games", icon: "🎖️", rarity: "rare", coinReward: 100, requirement: { stat: "total_wins", value: 25 } },
  { id: "wins_50", name: "Champion", description: "Win 50 games", icon: "🏆", rarity: "rare", coinReward: 200, requirement: { stat: "total_wins", value: 50 } },
  { id: "wins_100", name: "Centurion", description: "Win 100 games", icon: "💯", rarity: "epic", coinReward: 500, requirement: { stat: "total_wins", value: 100 } },
  { id: "wins_250", name: "Unstoppable", description: "Win 250 games", icon: "🔥", rarity: "epic", coinReward: 1000, requirement: { stat: "total_wins", value: 250 } },
  { id: "wins_500", name: "Godlike", description: "Win 500 games", icon: "👑", rarity: "legendary", coinReward: 2500, requirement: { stat: "total_wins", value: 500 } },

  // Games played
  { id: "games_10", name: "Casual Player", description: "Play 10 games", icon: "🎮", rarity: "common", coinReward: 15, requirement: { stat: "total_games", value: 10 } },
  { id: "games_50", name: "Regular", description: "Play 50 games", icon: "🕹️", rarity: "rare", coinReward: 75, requirement: { stat: "total_games", value: 50 } },
  { id: "games_200", name: "Dedicated", description: "Play 200 games", icon: "💻", rarity: "epic", coinReward: 300, requirement: { stat: "total_games", value: 200 } },
  { id: "games_500", name: "No-Lifer", description: "Play 500 games", icon: "🤯", rarity: "legendary", coinReward: 1500, requirement: { stat: "total_games", value: 500 } },

  // Streaks
  { id: "streak_3", name: "Hat Trick", description: "Reach a 3 win streak", icon: "🎩", rarity: "common", coinReward: 30, requirement: { stat: "max_streak", value: 3 } },
  { id: "streak_5", name: "On Fire", description: "Reach a 5 win streak", icon: "🔥", rarity: "rare", coinReward: 100, requirement: { stat: "max_streak", value: 5 } },
  { id: "streak_10", name: "Untouchable", description: "Reach a 10 win streak", icon: "⚡", rarity: "epic", coinReward: 400, requirement: { stat: "max_streak", value: 10 } },
  { id: "streak_20", name: "Invincible", description: "Reach a 20 win streak", icon: "💎", rarity: "legendary", coinReward: 2000, requirement: { stat: "max_streak", value: 20 } },

  // Levels
  { id: "level_5", name: "Apprentice", description: "Reach Level 5", icon: "📗", rarity: "common", coinReward: 20, requirement: { stat: "level", value: 5 } },
  { id: "level_10", name: "Strategist", description: "Reach Level 10", icon: "📘", rarity: "common", coinReward: 50, requirement: { stat: "level", value: 10 } },
  { id: "level_20", name: "Master", description: "Reach Level 20", icon: "📕", rarity: "rare", coinReward: 150, requirement: { stat: "level", value: 20 } },
  { id: "level_30", name: "Legend", description: "Reach Level 30", icon: "📙", rarity: "epic", coinReward: 500, requirement: { stat: "level", value: 30 } },
  { id: "level_50", name: "Divine", description: "Reach Level 50", icon: "✨", rarity: "legendary", coinReward: 3000, requirement: { stat: "level", value: 50 } },

  // Speed
  { id: "speed_30", name: "Quick Thinker", description: "Win a game in under 30 seconds", icon: "⏱️", rarity: "rare", coinReward: 75, requirement: { stat: "best_time", value: 30000, comparator: "lte" } },
  { id: "speed_15", name: "Lightning", description: "Win a game in under 15 seconds", icon: "⚡", rarity: "epic", coinReward: 250, requirement: { stat: "best_time", value: 15000, comparator: "lte" } },
  { id: "speed_10", name: "Flash", description: "Win a game in under 10 seconds", icon: "💨", rarity: "legendary", coinReward: 1000, requirement: { stat: "best_time", value: 10000, comparator: "lte" } },

  // Coins
  { id: "coins_500", name: "Saver", description: "Accumulate 500 coins", icon: "🪙", rarity: "common", coinReward: 25, requirement: { stat: "coins", value: 500 } },
  { id: "coins_2000", name: "Rich", description: "Accumulate 2,000 coins", icon: "💰", rarity: "rare", coinReward: 100, requirement: { stat: "coins", value: 2000 } },
  { id: "coins_5000", name: "Wealthy", description: "Accumulate 5,000 coins", icon: "💎", rarity: "epic", coinReward: 300, requirement: { stat: "coins", value: 5000 } },
  { id: "coins_10000", name: "Tycoon", description: "Accumulate 10,000 coins", icon: "🏦", rarity: "legendary", coinReward: 1000, requirement: { stat: "coins", value: 10000 } },
];
