export interface ShopItem {
  id: string;
  type: "theme" | "avatar";
  name: string;
  description: string;
  price: number;
  preview: string; // emoji or color swatch
  rarity: "common" | "rare" | "epic" | "legendary";
  unlockLevel?: number; // minimum level to purchase
}

export const SHOP_THEMES: ShopItem[] = [
  {
    id: "theme_cyber",
    type: "theme",
    name: "Cyberpunk",
    description: "Neon pink & electric blue vibes",
    price: 80,
    preview: "🌆",
    rarity: "rare",
    unlockLevel: 3,
  },
  {
    id: "theme_forest",
    type: "theme",
    name: "Enchanted Forest",
    description: "Deep greens and mystical glow",
    price: 80,
    preview: "🌲",
    rarity: "rare",
    unlockLevel: 3,
  },
  {
    id: "theme_galaxy",
    type: "theme",
    name: "Galaxy",
    description: "Cosmic purple and starfield",
    price: 150,
    preview: "🌌",
    rarity: "epic",
    unlockLevel: 8,
  },
  {
    id: "theme_lava",
    type: "theme",
    name: "Volcano",
    description: "Molten lava reds and oranges",
    price: 150,
    preview: "🌋",
    rarity: "epic",
    unlockLevel: 8,
  },
  {
    id: "theme_arctic",
    type: "theme",
    name: "Arctic Frost",
    description: "Icy blues and frozen whites",
    price: 120,
    preview: "❄️",
    rarity: "rare",
    unlockLevel: 5,
  },
  {
    id: "theme_gold",
    type: "theme",
    name: "Royal Gold",
    description: "Luxurious gold and deep black",
    price: 300,
    preview: "👑",
    rarity: "legendary",
    unlockLevel: 15,
  },
  {
    id: "theme_retro",
    type: "theme",
    name: "Retro Arcade",
    description: "Pixel-perfect nostalgia",
    price: 100,
    preview: "🕹️",
    rarity: "rare",
    unlockLevel: 5,
  },
  {
    id: "theme_cherry",
    type: "theme",
    name: "Cherry Blossom",
    description: "Soft pinks and gentle spring",
    price: 200,
    preview: "🌸",
    rarity: "epic",
    unlockLevel: 10,
  },
];

export const SHOP_AVATARS: ShopItem[] = [
  {
    id: "avatar_ninja",
    type: "avatar",
    name: "Ninja",
    description: "Silent but deadly",
    price: 50,
    preview: "🥷",
    rarity: "common",
  },
  {
    id: "avatar_dragon",
    type: "avatar",
    name: "Dragon",
    description: "Breathe fire on the board",
    price: 100,
    preview: "🐉",
    rarity: "rare",
    unlockLevel: 5,
  },
  {
    id: "avatar_wizard",
    type: "avatar",
    name: "Wizard",
    description: "Master of strategy",
    price: 100,
    preview: "🧙",
    rarity: "rare",
    unlockLevel: 5,
  },
  {
    id: "avatar_ghost",
    type: "avatar",
    name: "Ghost",
    description: "Spooky presence",
    price: 60,
    preview: "👻",
    rarity: "common",
  },
  {
    id: "avatar_crown",
    type: "avatar",
    name: "Royal",
    description: "Born to rule",
    price: 200,
    preview: "🤴",
    rarity: "epic",
    unlockLevel: 10,
  },
  {
    id: "avatar_ufo",
    type: "avatar",
    name: "UFO",
    description: "Out of this world",
    price: 150,
    preview: "🛸",
    rarity: "epic",
    unlockLevel: 8,
  },
  {
    id: "avatar_skull",
    type: "avatar",
    name: "Skull",
    description: "Fear the reaper",
    price: 80,
    preview: "💀",
    rarity: "rare",
    unlockLevel: 3,
  },
  {
    id: "avatar_phoenix",
    type: "avatar",
    name: "Phoenix",
    description: "Rise from the ashes",
    price: 350,
    preview: "🔥",
    rarity: "legendary",
    unlockLevel: 20,
  },
  {
    id: "avatar_diamond",
    type: "avatar",
    name: "Diamond",
    description: "Unbreakable brilliance",
    price: 500,
    preview: "💎",
    rarity: "legendary",
    unlockLevel: 25,
  },
  {
    id: "avatar_samurai",
    type: "avatar",
    name: "Samurai",
    description: "Honor and steel",
    price: 120,
    preview: "⚔️",
    rarity: "rare",
    unlockLevel: 7,
  },
];

export const ALL_SHOP_ITEMS = [...SHOP_THEMES, ...SHOP_AVATARS];

export const RARITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: {
    bg: "bg-secondary/60",
    border: "border-border/50",
    text: "text-muted-foreground",
    glow: "",
  },
  rare: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/10",
  },
  epic: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/10",
  },
  legendary: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20 shadow-lg",
  },
};

// Theme CSS variable overrides for purchased themes
export const THEME_STYLES: Record<string, { accent: string; cellBg: string; boardBg: string }> = {
  theme_cyber: { accent: "330 100% 50%", cellBg: "260 30% 12%", boardBg: "270 25% 10%" },
  theme_forest: { accent: "140 70% 40%", cellBg: "150 25% 12%", boardBg: "155 20% 8%" },
  theme_galaxy: { accent: "280 80% 65%", cellBg: "260 35% 14%", boardBg: "265 30% 8%" },
  theme_lava: { accent: "15 90% 50%", cellBg: "10 30% 14%", boardBg: "5 25% 8%" },
  theme_arctic: { accent: "200 85% 60%", cellBg: "210 20% 16%", boardBg: "215 18% 10%" },
  theme_gold: { accent: "45 100% 50%", cellBg: "40 20% 12%", boardBg: "35 15% 6%" },
  theme_retro: { accent: "120 80% 50%", cellBg: "0 0% 10%", boardBg: "0 0% 5%" },
  theme_cherry: { accent: "340 80% 65%", cellBg: "345 20% 14%", boardBg: "350 15% 8%" },
};
