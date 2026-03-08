import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Purchase {
  id: string;
  item_id: string;
  item_type: string;
  equipped: boolean;
}

export function useShop() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const [purchasesRes, profileRes] = await Promise.all([
      supabase.from("user_purchases").select("id, item_id, item_type, equipped").eq("user_id", user.id),
      supabase.from("profiles").select("coins, level").eq("user_id", user.id).single(),
    ]);

    if (purchasesRes.data) setPurchases(purchasesRes.data);
    if (profileRes.data) {
      setCoins(profileRes.data.coins);
      setLevel((profileRes.data as any).level ?? 1);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isPurchased = (itemId: string) => purchases.some((p) => p.item_id === itemId);
  const isEquipped = (itemId: string) => purchases.some((p) => p.item_id === itemId && p.equipped);

  const getEquippedTheme = () => purchases.find((p) => p.item_type === "theme" && p.equipped)?.item_id || null;
  const getEquippedAvatar = () => purchases.find((p) => p.item_type === "avatar" && p.equipped)?.item_id || null;

  const purchaseItem = useCallback(async (itemId: string, itemType: "theme" | "avatar", price: number) => {
    if (!user) { toast("Sign in to purchase items"); return false; }
    if (coins < price) { toast("Not enough coins!"); return false; }

    const { data, error } = await supabase.functions.invoke("economy", {
      body: { action: "purchase_item", item_id: itemId },
    });

    if (error || data?.error) {
      toast(data?.error || "Purchase failed");
      return false;
    }

    setCoins(data.coins);
    await fetchData();
    toast(`🎉 Purchased! -${price} coins`);
    return true;
  }, [user, coins, fetchData]);

  const equipItem = useCallback(async (itemId: string, itemType: "theme" | "avatar") => {
    if (!user) return;

    // Equip/unequip only changes the `equipped` boolean — not economy columns, so direct write is safe
    await supabase
      .from("user_purchases")
      .update({ equipped: false })
      .eq("user_id", user.id)
      .eq("item_type", itemType);

    await supabase
      .from("user_purchases")
      .update({ equipped: true })
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    await fetchData();
    toast("✅ Equipped!");
  }, [user, fetchData]);

  const unequipItem = useCallback(async (itemId: string) => {
    if (!user) return;

    await supabase
      .from("user_purchases")
      .update({ equipped: false })
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    await fetchData();
    toast("Unequipped");
  }, [user, fetchData]);

  return {
    purchases, loading, coins, level,
    isPurchased, isEquipped, getEquippedTheme, getEquippedAvatar,
    purchaseItem, equipItem, unequipItem, refresh: fetchData,
  };
}
