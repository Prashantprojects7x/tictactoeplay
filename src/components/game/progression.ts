// XP & Level progression system

export const XP_PER_LEVEL = 100;
export const MAX_LEVEL = 50;

export const LEVEL_TITLES: Record<number, string> = {
  1: "Novice",
  5: "Apprentice",
  10: "Strategist",
  15: "Tactician",
  20: "Master",
  25: "Grandmaster",
  30: "Legend",
  35: "Mythic",
  40: "Immortal",
  45: "Transcendent",
  50: "Divine",
};

export function getLevelTitle(level: number): string {
  let title = "Novice";
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= Number(lvl)) title = t;
  }
  return title;
}

export function getLevelColor(level: number): string {
  if (level >= 40) return "from-amber-400 to-red-500";
  if (level >= 30) return "from-purple-400 to-pink-500";
  if (level >= 20) return "from-blue-400 to-cyan-400";
  if (level >= 10) return "from-green-400 to-emerald-500";
  if (level >= 5) return "from-slate-300 to-slate-400";
  return "from-zinc-400 to-zinc-500";
}

export function xpForLevel(level: number): number {
  return Math.floor(XP_PER_LEVEL * (1 + (level - 1) * 0.15));
}

export function calculateXpGain(outcome: "win" | "loss" | "draw", gameTime: number, difficulty?: string): number {
  let base = outcome === "win" ? 30 : outcome === "draw" ? 10 : 5;

  // Difficulty bonus for AI games
  if (difficulty === "hard") base = Math.floor(base * 1.5);
  else if (difficulty === "medium") base = Math.floor(base * 1.2);

  // Speed bonus: under 30s = +50%, under 60s = +25%
  if (outcome === "win" && gameTime < 30) base = Math.floor(base * 1.5);
  else if (outcome === "win" && gameTime < 60) base = Math.floor(base * 1.25);

  return base;
}

export function processXpGain(currentXp: number, currentLevel: number, xpGained: number): {
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  levelsGained: number;
} {
  let xp = currentXp + xpGained;
  let level = currentLevel;
  let levelsGained = 0;

  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    levelsGained += 1;
  }

  return { newXp: xp, newLevel: level, leveledUp: levelsGained > 0, levelsGained };
}
