import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// XP helpers (mirrored from frontend progression.ts)
const XP_PER_LEVEL_BASE = 100;
const MAX_LEVEL = 50;
function xpForLevel(level: number) {
  return Math.floor(XP_PER_LEVEL_BASE * (1 + (level - 1) * 0.15));
}
function processXpGain(currentXp: number, currentLevel: number, xpGained: number) {
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

// Battle pass constants
const BATTLE_PASS_COST = 1000;
const BATTLE_PASS_SEASON = 1;
const XP_PER_TIER = 50;
const TOTAL_TIERS = 20;
const COIN_TIERS: Record<number, number> = {
  1: 50, 3: 100, 5: 200, 7: 150, 9: 300, 11: 100, 13: 250, 15: 500, 17: 400, 19: 750,
};
const DIAMOND_TOKEN_TIER = 20; // Tier 20 grants a diamond token for free tournament creation

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!
  );
  const { data } = await anonClient.auth.getUser(token);
  return data?.user?.id ?? null;
}

async function getProfile(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin.from("profiles").select("*").eq("user_id", userId).single();
  if (error) throw new Error("Profile not found");
  return data;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const userId = await getUserId(req);
    if (!userId) return errorResponse("Unauthorized", 401);

    const { action, ...params } = await req.json();
    const admin = getAdminClient();

    switch (action) {
      case "purchase_item": {
        const { item_id, item_type, price } = params;
        if (!item_id || !item_type || typeof price !== "number" || price < 0)
          return errorResponse("Invalid parameters");

        const profile = await getProfile(admin, userId);
        if (profile.coins < price) return errorResponse("Not enough coins");

        // Check if already purchased
        const { data: existing } = await admin
          .from("user_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("item_id", item_id)
          .maybeSingle();
        if (existing) return errorResponse("Already purchased");

        // Deduct coins
        const { error: coinErr } = await admin
          .from("profiles")
          .update({ coins: profile.coins - price })
          .eq("user_id", userId);
        if (coinErr) return errorResponse("Failed to deduct coins");

        // Insert purchase
        const { error: purchaseErr } = await admin
          .from("user_purchases")
          .insert({ user_id: userId, item_id, item_type });
        if (purchaseErr) {
          // Refund
          await admin.from("profiles").update({ coins: profile.coins }).eq("user_id", userId);
          return errorResponse("Purchase failed");
        }

        return jsonResponse({ success: true, coins: profile.coins - price });
      }

      case "purchase_battle_pass": {
        const profile = await getProfile(admin, userId);
        if (profile.coins < BATTLE_PASS_COST) return errorResponse("Not enough coins");

        // Check if already owned
        const { data: existing } = await admin
          .from("battle_pass")
          .select("id")
          .eq("user_id", userId)
          .eq("season", BATTLE_PASS_SEASON)
          .maybeSingle();
        if (existing) return errorResponse("Already owned");

        const { error: coinErr } = await admin
          .from("profiles")
          .update({ coins: profile.coins - BATTLE_PASS_COST })
          .eq("user_id", userId);
        if (coinErr) return errorResponse("Failed to deduct coins");

        const { error: bpErr } = await admin
          .from("battle_pass")
          .insert({ user_id: userId, season: BATTLE_PASS_SEASON, current_tier: 0, xp_progress: 0 });
        if (bpErr) {
          await admin.from("profiles").update({ coins: profile.coins }).eq("user_id", userId);
          return errorResponse("Purchase failed");
        }

        return jsonResponse({ success: true, coins: profile.coins - BATTLE_PASS_COST });
      }

      case "sync_game": {
        const { outcome, elapsed, xp_gained } = params;
        if (!["win", "loss", "draw"].includes(outcome)) return errorResponse("Invalid outcome");
        if (typeof xp_gained !== "number" || xp_gained < 0 || xp_gained > 200)
          return errorResponse("Invalid XP");

        const profile = await getProfile(admin, userId);
        const updates: Record<string, unknown> = {
          total_games: profile.total_games + 1,
        };

        if (outcome === "win") {
          updates.total_wins = profile.total_wins + 1;
          updates.win_streak = profile.win_streak + 1;
          updates.coins = profile.coins + 10;
          if (profile.win_streak + 1 > profile.max_streak) {
            updates.max_streak = profile.win_streak + 1;
          }
          if (elapsed > 0 && (profile.best_time === null || elapsed < profile.best_time)) {
            updates.best_time = elapsed;
          }
        } else if (outcome === "loss") {
          updates.win_streak = 0;
        }

        // XP & Level
        const { newXp, newLevel } = processXpGain(profile.xp, profile.level, xp_gained);
        updates.xp = newXp;
        updates.level = newLevel;

        const { data: updated } = await admin
          .from("profiles")
          .update(updates)
          .eq("user_id", userId)
          .select()
          .single();

        return jsonResponse({ success: true, profile: updated });
      }

      case "add_bp_xp": {
        const { xp_amount } = params;
        if (typeof xp_amount !== "number" || xp_amount < 0 || xp_amount > 500)
          return errorResponse("Invalid XP amount");

        const { data: bp } = await admin
          .from("battle_pass")
          .select("*")
          .eq("user_id", userId)
          .eq("season", BATTLE_PASS_SEASON)
          .maybeSingle();
        if (!bp) return errorResponse("No battle pass");

        let newXp = (bp.xp_progress ?? 0) + xp_amount;
        let newTier = bp.current_tier ?? 0;
        let coinsToAdd = 0;
        let diamondTokensToAdd = 0;

        while (newTier < TOTAL_TIERS && newXp >= XP_PER_TIER) {
          newXp -= XP_PER_TIER;
          newTier += 1;
          if (COIN_TIERS[newTier]) coinsToAdd += COIN_TIERS[newTier];
          if (newTier === DIAMOND_TOKEN_TIER) diamondTokensToAdd += 1;
        }
        if (newTier >= TOTAL_TIERS) newXp = 0;

        await admin
          .from("battle_pass")
          .update({ current_tier: newTier, xp_progress: newXp })
          .eq("user_id", userId)
          .eq("season", BATTLE_PASS_SEASON);

        if (coinsToAdd > 0 || diamondTokensToAdd > 0) {
          const profile = await getProfile(admin, userId);
          const profileUpdates: Record<string, unknown> = {};
          if (coinsToAdd > 0) profileUpdates.coins = profile.coins + coinsToAdd;
          if (diamondTokensToAdd > 0) profileUpdates.diamond_tokens = (profile.diamond_tokens ?? 0) + diamondTokensToAdd;
          await admin.from("profiles").update(profileUpdates).eq("user_id", userId);
        }

        return jsonResponse({
          success: true, current_tier: newTier, xp_progress: newXp,
          coins_earned: coinsToAdd, diamond_tokens_earned: diamondTokensToAdd,
        });
      }

      case "deduct_coins": {
        const { amount } = params;
        if (typeof amount !== "number" || amount <= 0) return errorResponse("Invalid amount");

        const profile = await getProfile(admin, userId);
        if (profile.coins < amount) return errorResponse("Not enough coins");

        await admin.from("profiles").update({ coins: profile.coins - amount }).eq("user_id", userId);
        return jsonResponse({ success: true, coins: profile.coins - amount });
      }

      case "award_coins": {
        const { target_user_id, amount } = params;
        if (typeof amount !== "number" || amount <= 0 || amount > 10000)
          return errorResponse("Invalid amount");
        if (!target_user_id) return errorResponse("Missing target user");

        const targetProfile = await getProfile(admin, target_user_id);
        await admin
          .from("profiles")
          .update({ coins: targetProfile.coins + amount })
          .eq("user_id", target_user_id);
        return jsonResponse({ success: true });
      }

      default:
        return errorResponse("Unknown action");
    }
  } catch (e) {
    console.error("Economy error:", e);
    return errorResponse("Internal error", 500);
  }
});
