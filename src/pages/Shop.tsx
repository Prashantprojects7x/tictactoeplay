import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Coins, Crown, Lock, Check, ShoppingBag, Sparkles, Palette, SmilePlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/hooks/useShop";
import {
  SHOP_THEMES, SHOP_AVATARS, RARITY_COLORS, type ShopItem,
} from "@/components/game/shopData";

export default function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shop = useShop();
  const [tab, setTab] = useState<"themes" | "avatars">("themes");
  const [purchasing, setPurchasing] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground font-medium">Sign in to access the shop</p>
        <Link to="/auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const items = tab === "themes" ? SHOP_THEMES : SHOP_AVATARS;

  const handlePurchase = async (item: ShopItem) => {
    if (shop.isPurchased(item.id)) return;
    if (item.unlockLevel && shop.level < item.unlockLevel) return;
    setPurchasing(item.id);
    await shop.purchaseItem(item.id, item.type, item.price);
    setPurchasing(null);
  };

  const handleEquip = async (item: ShopItem) => {
    if (shop.isEquipped(item.id)) {
      await shop.unequipItem(item.id);
    } else {
      await shop.equipItem(item.id, item.type);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back to Game</span>
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="font-[JetBrains_Mono] text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              🛍️ Shop
            </span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm">
            <span className="flex items-center gap-1.5 font-bold">
              <Coins className="w-4 h-4 text-[hsl(var(--gold))]" /> {shop.coins} coins
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Crown className="w-4 h-4" /> Level {shop.level}
            </span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 justify-center mb-6">
          {([
            { key: "themes" as const, icon: Palette, label: "Board Themes" },
            { key: "avatars" as const, icon: SmilePlus, label: "Avatars" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        {shop.loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const owned = shop.isPurchased(item.id);
                const equipped = shop.isEquipped(item.id);
                const locked = item.unlockLevel ? shop.level < item.unlockLevel : false;
                const canAfford = shop.coins >= item.price;
                const rarity = RARITY_COLORS[item.rarity];
                const isBuying = purchasing === item.id;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                    className={`relative rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all
                      ${equipped ? "border-accent/60 bg-accent/5 ring-1 ring-accent/20" : `${rarity.border} ${rarity.bg}`}
                      ${rarity.glow}
                      ${locked ? "opacity-50" : ""}
                    `}
                  >
                    {/* Rarity badge */}
                    <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider ${rarity.text}`}>
                      {item.rarity}
                    </span>

                    {/* Equipped indicator */}
                    {equipped && (
                      <span className="absolute top-2 left-2 flex items-center gap-0.5 text-[9px] font-bold text-accent uppercase">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}

                    {/* Preview */}
                    <div className="text-4xl mt-2 mb-1">{item.preview}</div>

                    {/* Name & description */}
                    <p className="font-bold text-sm text-center">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground text-center leading-tight">{item.description}</p>

                    {/* Level requirement */}
                    {locked && item.unlockLevel && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Lock className="w-3 h-3" /> Level {item.unlockLevel}
                      </div>
                    )}

                    {/* Action button */}
                    <div className="mt-auto pt-2 w-full">
                      {owned ? (
                        <button
                          onClick={() => handleEquip(item)}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                            equipped
                              ? "bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30"
                              : "bg-secondary text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {equipped ? "Unequip" : "Equip"}
                        </button>
                      ) : locked ? (
                        <div className="w-full py-2 rounded-xl text-xs font-bold text-center bg-secondary/50 text-muted-foreground">
                          <Lock className="w-3 h-3 inline mr-1" /> Locked
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford || isBuying}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 ${
                            canAfford
                              ? "bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20"
                              : "bg-secondary/50 text-muted-foreground cursor-not-allowed"
                          }`}
                        >
                          {isBuying ? (
                            <Sparkles className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <Coins className="w-3 h-3" /> {item.price}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
