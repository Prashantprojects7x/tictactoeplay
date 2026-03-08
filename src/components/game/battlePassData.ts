export const BATTLE_PASS_COST = 1000;
export const BATTLE_PASS_SEASON = 1;
export const XP_PER_TIER = 50;
export const TOTAL_TIERS = 20;

export interface BattlePassTier {
  tier: number;
  reward: string;
  type: "coins" | "avatar" | "theme" | "title" | "xp_boost" | "diamond_token";
  value: string | number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const BATTLE_PASS_TIERS: BattlePassTier[] = [
  { tier: 1, reward: "50 Coins", type: "coins", value: 50, icon: "🪙", rarity: "common" },
  { tier: 2, reward: "Flame Avatar", type: "avatar", value: "🔥", icon: "🔥", rarity: "common" },
  { tier: 3, reward: "100 Coins", type: "coins", value: 100, icon: "🪙", rarity: "common" },
  { tier: 4, reward: "Lightning Avatar", type: "avatar", value: "⚡", icon: "⚡", rarity: "rare" },
  { tier: 5, reward: "200 Coins", type: "coins", value: 200, icon: "💰", rarity: "rare" },
  { tier: 6, reward: "Dragon Avatar", type: "avatar", value: "🐉", icon: "🐉", rarity: "rare" },
  { tier: 7, reward: "150 Coins", type: "coins", value: 150, icon: "🪙", rarity: "common" },
  { tier: 8, reward: "Skull Avatar", type: "avatar", value: "💀", icon: "💀", rarity: "epic" },
  { tier: 9, reward: "300 Coins", type: "coins", value: 300, icon: "💰", rarity: "epic" },
  { tier: 10, reward: "Crown Avatar", type: "avatar", value: "👑", icon: "👑", rarity: "epic" },
  { tier: 11, reward: "100 Coins", type: "coins", value: 100, icon: "🪙", rarity: "common" },
  { tier: 12, reward: "Alien Avatar", type: "avatar", value: "👽", icon: "👽", rarity: "rare" },
  { tier: 13, reward: "250 Coins", type: "coins", value: 250, icon: "💰", rarity: "rare" },
  { tier: 14, reward: "Robot Avatar", type: "avatar", value: "🤖", icon: "🤖", rarity: "epic" },
  { tier: 15, reward: "500 Coins", type: "coins", value: 500, icon: "💎", rarity: "epic" },
  { tier: 16, reward: "Ninja Avatar", type: "avatar", value: "🥷", icon: "🥷", rarity: "epic" },
  { tier: 17, reward: "400 Coins", type: "coins", value: 400, icon: "💰", rarity: "rare" },
  { tier: 18, reward: "Unicorn Avatar", type: "avatar", value: "🦄", icon: "🦄", rarity: "legendary" },
  { tier: 19, reward: "750 Coins", type: "coins", value: 750, icon: "💎", rarity: "legendary" },
  { tier: 20, reward: "💠 Diamond Token — Free Tournament", type: "diamond_token", value: 1, icon: "💠", rarity: "legendary" },
];
