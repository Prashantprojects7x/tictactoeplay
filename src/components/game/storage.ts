import type { GameStats, GameHistoryEntry, CoinHistoryEntry } from "./types";

const LS = {
  get: (key: string, fallback: string = "") => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set: (key: string, val: string) => {
    try { localStorage.setItem(key, val); } catch {}
  },
  getJSON: <T>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  setJSON: (key: string, val: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  getInt: (key: string, fallback = 0) => {
    try { return parseInt(localStorage.getItem(key) || String(fallback), 10) || fallback; } catch { return fallback; }
  },
};

// Coins
export function getCoins(player: "X" | "O"): number {
  return LS.getInt(`ttt_coins_${player}`, 0);
}

export function setCoins(player: "X" | "O", amount: number) {
  LS.set(`ttt_coins_${player}`, String(amount));
}

export function addCoinsToStorage(player: "X" | "O", amount: number): number {
  const current = getCoins(player);
  const updated = current + amount;
  setCoins(player, updated);
  persistCoinHistory({ t: Date.now(), player, amount });
  return updated;
}

// Coin history
export function getCoinHistory(): CoinHistoryEntry[] {
  return LS.getJSON("ttt_coins_history", []);
}

function persistCoinHistory(entry: CoinHistoryEntry) {
  const arr = getCoinHistory();
  arr.push(entry);
  if (arr.length > 100) arr.splice(0, arr.length - 100);
  LS.setJSON("ttt_coins_history", arr);
}

export function resetCoinsStorage() {
  try {
    localStorage.removeItem("ttt_coins_X");
    localStorage.removeItem("ttt_coins_O");
    localStorage.removeItem("ttt_coins_history");
  } catch {}
}

// Player names & avatars
export function getPlayerName(player: "X" | "O"): string {
  return LS.get(`ttt_name_${player}`) || `Player ${player}`;
}

export function setPlayerName(player: "X" | "O", name: string) {
  LS.set(`ttt_name_${player}`, name.trim());
}

export function getAvatar(player: "X" | "O"): string {
  return LS.get(`ttt_avatar_${player}`, "🎮");
}

export function setAvatarStorage(player: "X" | "O", emoji: string) {
  LS.set(`ttt_avatar_${player}`, emoji);
}

// Game stats
const DEFAULT_STATS: GameStats = { wins: 0, games: 0, bestTime: null, winStreak: 0, maxStreak: 0 };

export function getGameStats(): GameStats {
  return LS.getJSON("ttt_game_stats", DEFAULT_STATS);
}

export function recordWin(elapsedTime: number) {
  const stats = getGameStats();
  stats.wins += 1;
  stats.games += 1;
  stats.winStreak += 1;
  if (stats.winStreak > (stats.maxStreak || 0)) stats.maxStreak = stats.winStreak;
  if (elapsedTime > 0 && (stats.bestTime === null || elapsedTime < stats.bestTime)) {
    stats.bestTime = elapsedTime;
  }
  LS.setJSON("ttt_game_stats", stats);
}

export function recordLoss() {
  const stats = getGameStats();
  stats.games += 1;
  stats.winStreak = 0;
  LS.setJSON("ttt_game_stats", stats);
}

export function recordDraw() {
  const stats = getGameStats();
  stats.games += 1;
  LS.setJSON("ttt_game_stats", stats);
}

// Game history
export function getGameHistory(): GameHistoryEntry[] {
  return LS.getJSON("ttt_game_history", []);
}

export function addGameHistory(entry: GameHistoryEntry) {
  const history = getGameHistory();
  history.push(entry);
  if (history.length > 20) history.shift();
  LS.setJSON("ttt_game_history", history);
}

// Achievements
export function getAchievements(): Record<string, { unlockedAt: number }> {
  return LS.getJSON("ttt_achievements", {});
}

export function unlockAchievementStorage(id: string): boolean {
  const achievements = getAchievements();
  if (achievements[id]) return false;
  achievements[id] = { unlockedAt: Date.now() };
  LS.setJSON("ttt_achievements", achievements);
  return true;
}

// Daily login
export function checkDailyLogin(): { isNew: boolean; bonus: number; streak: number } {
  const today = new Date().toDateString();
  const lastLogin = LS.get("ttt_last_login");
  const loginStreak = LS.getInt("ttt_login_streak", 0);

  if (lastLogin === today) return { isNew: false, bonus: 0, streak: loginStreak };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const newStreak = lastLogin === yesterday.toDateString() ? loginStreak + 1 : 1;

  LS.set("ttt_last_login", today);
  LS.set("ttt_login_streak", String(newStreak));

  const bonus = Math.min(newStreak * 2, 20);
  return { isNew: true, bonus, streak: newStreak };
}
