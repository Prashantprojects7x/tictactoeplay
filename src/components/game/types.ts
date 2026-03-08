export type Player = "X" | "O" | null;
export type Difficulty = "easy" | "medium" | "hard";
export type BoardTheme = "default" | "neon" | "ocean" | "sunset";

export interface MoveRecord {
  index: number;
  player: "X" | "O";
  moveNumber: number;
  timestamp: number;
}

export interface GameStats {
  wins: number;
  games: number;
  bestTime: number | null;
  winStreak: number;
  maxStreak: number;
}

export interface GameHistoryEntry {
  outcome: "win" | "loss" | "draw";
  time: number;
  date: number;
  mode: string;
  opponent: string;
}

export interface AchievementDef {
  emoji: string;
  name: string;
  desc: string;
}

export interface CoinHistoryEntry {
  t: number;
  player: "X" | "O";
  amount: number;
}

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const ACHIEVEMENT_DEFS: Record<string, AchievementDef> = {
  first_win: { emoji: "🎯", name: "First Win", desc: "Win your first game" },
  five_wins: { emoji: "⭐", name: "5 Wins", desc: "Win 5 games total" },
  ten_wins: { emoji: "🌟", name: "10 Wins", desc: "Win 10 games total" },
  twenty_wins: { emoji: "✨", name: "20 Wins", desc: "Win 20 games total" },
  perfect_game: { emoji: "👑", name: "Perfect Game", desc: "Win without opponent scoring" },
  daily_login: { emoji: "📅", name: "Daily Login", desc: "Login 7 days in a row" },
  coin_collector: { emoji: "💰", name: "Coin Collector", desc: "Earn 100 coins total" },
  speedster: { emoji: "⚡", name: "Speedster", desc: "Win a game in under 30 seconds" },
};

export const AVATARS = [
  { value: "🎮", label: "Player" },
  { value: "👨", label: "Man" },
  { value: "👩", label: "Woman" },
  { value: "🤖", label: "Robot" },
  { value: "👾", label: "Alien" },
  { value: "🐱", label: "Cat" },
  { value: "🦊", label: "Fox" },
  { value: "🦸", label: "Hero" },
];

export const BOARD_THEMES: Record<BoardTheme, { label: string; accent: string; cellBg: string }> = {
  default: { label: "Default", accent: "260 85% 65%", cellBg: "230 20% 15%" },
  neon: { label: "Neon", accent: "330 100% 50%", cellBg: "230 30% 12%" },
  ocean: { label: "Ocean", accent: "200 100% 45%", cellBg: "210 30% 14%" },
  sunset: { label: "Sunset", accent: "25 100% 55%", cellBg: "15 20% 14%" },
};

export const POWERUP_COSTS = { peek: 50, extra: 6, shield: 50 };
