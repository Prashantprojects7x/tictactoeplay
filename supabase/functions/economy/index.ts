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

// Server-side price catalog (canonical prices — never trust client)
const ITEM_CATALOG: Record<string, { type: string; price: number; unlockLevel?: number }> = {
  theme_cyber: { type: "theme", price: 80, unlockLevel: 3 },
  theme_forest: { type: "theme", price: 80, unlockLevel: 3 },
  theme_galaxy: { type: "theme", price: 150, unlockLevel: 8 },
  theme_lava: { type: "theme", price: 150, unlockLevel: 8 },
  theme_arctic: { type: "theme", price: 120, unlockLevel: 5 },
  theme_gold: { type: "theme", price: 300, unlockLevel: 15 },
  theme_retro: { type: "theme", price: 100, unlockLevel: 5 },
  theme_cherry: { type: "theme", price: 200, unlockLevel: 10 },
  avatar_ninja: { type: "avatar", price: 50 },
  avatar_dragon: { type: "avatar", price: 100, unlockLevel: 5 },
  avatar_wizard: { type: "avatar", price: 100, unlockLevel: 5 },
  avatar_ghost: { type: "avatar", price: 60 },
  avatar_crown: { type: "avatar", price: 200, unlockLevel: 10 },
  avatar_ufo: { type: "avatar", price: 150, unlockLevel: 8 },
  avatar_skull: { type: "avatar", price: 80, unlockLevel: 3 },
  avatar_phoenix: { type: "avatar", price: 350, unlockLevel: 20 },
  avatar_diamond: { type: "avatar", price: 500, unlockLevel: 25 },
  avatar_samurai: { type: "avatar", price: 120, unlockLevel: 7 },
};

// Battle pass constants
const BATTLE_PASS_COST = 1000;
const BATTLE_PASS_SEASON = 1;
const XP_PER_TIER = 50;
const TOTAL_TIERS = 20;
const COIN_TIERS: Record<number, number> = {
  1: 50, 3: 100, 5: 200, 7: 150, 9: 300, 11: 100, 13: 250, 15: 500, 17: 400, 19: 750,
};
const DIAMOND_TOKEN_TIER = 20;

// Achievement definitions (must match frontend achievementsData.ts)
const ACHIEVEMENT_REWARDS: Record<string, number> = {
  "first-win": 50, "streak-3": 100, "streak-5": 200, "streak-10": 500,
  "games-10": 100, "games-50": 250, "games-100": 500,
  "wins-10": 150, "wins-25": 300, "wins-50": 750,
  "speed-30": 200, "speed-15": 500,
  "level-5": 100, "level-10": 250, "level-25": 500,
  "coins-500": 100, "coins-1000": 250,
};

const ACHIEVEMENT_REQUIREMENTS: Record<string, { stat: string; value: number; comparator?: string }> = {
  "first-win": { stat: "total_wins", value: 1 },
  "streak-3": { stat: "max_streak", value: 3 },
  "streak-5": { stat: "max_streak", value: 5 },
  "streak-10": { stat: "max_streak", value: 10 },
  "games-10": { stat: "total_games", value: 10 },
  "games-50": { stat: "total_games", value: 50 },
  "games-100": { stat: "total_games", value: 100 },
  "wins-10": { stat: "total_wins", value: 10 },
  "wins-25": { stat: "total_wins", value: 25 },
  "wins-50": { stat: "total_wins", value: 50 },
  "speed-30": { stat: "best_time", value: 30, comparator: "lte" },
  "speed-15": { stat: "best_time", value: 15, comparator: "lte" },
  "level-5": { stat: "level", value: 5 },
  "level-10": { stat: "level", value: 10 },
  "level-25": { stat: "level", value: 25 },
  "coins-500": { stat: "coins", value: 500 },
  "coins-1000": { stat: "coins", value: 1000 },
};

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");

  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!anonKey || !url) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    return null;
  }

  const anonClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await anonClient.auth.getUser(token);
  if (error) { console.error("Auth error:", error.message); return null; }
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
        const { item_id } = params;
        if (!item_id || typeof item_id !== "string")
          return errorResponse("Invalid parameters");

        const catalogItem = ITEM_CATALOG[item_id];
        if (!catalogItem) return errorResponse("Unknown item");

        const price = catalogItem.price;
        const item_type = catalogItem.type;

        const profile = await getProfile(admin, userId);

        if (catalogItem.unlockLevel && profile.level < catalogItem.unlockLevel)
          return errorResponse("Level too low to purchase this item");

        if (profile.coins < price) return errorResponse("Not enough coins");

        const { data: existing } = await admin
          .from("user_purchases")
          .select("id")
          .eq("user_id", userId)
          .eq("item_id", item_id)
          .maybeSingle();
        if (existing) return errorResponse("Already purchased");

        const { error: coinErr } = await admin
          .from("profiles")
          .update({ coins: profile.coins - price })
          .eq("user_id", userId);
        if (coinErr) return errorResponse("Failed to deduct coins");

        const { error: purchaseErr } = await admin
          .from("user_purchases")
          .insert({ user_id: userId, item_id, item_type });
        if (purchaseErr) {
          await admin.from("profiles").update({ coins: profile.coins }).eq("user_id", userId);
          return errorResponse("Purchase failed");
        }

        return jsonResponse({ success: true, coins: profile.coins - price });
      }

      case "purchase_battle_pass": {
        const profile = await getProfile(admin, userId);
        if (profile.coins < BATTLE_PASS_COST) return errorResponse("Not enough coins");

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

      // Server-verified achievement claim — validates eligibility before awarding coins
      case "claim_achievement": {
        const { achievement_id } = params;
        if (!achievement_id || typeof achievement_id !== "string")
          return errorResponse("Invalid achievement_id");

        const reward = ACHIEVEMENT_REWARDS[achievement_id];
        const requirement = ACHIEVEMENT_REQUIREMENTS[achievement_id];
        if (reward === undefined || !requirement)
          return errorResponse("Unknown achievement");

        // Check if already claimed
        const { data: existing } = await admin
          .from("user_achievements")
          .select("id")
          .eq("user_id", userId)
          .eq("achievement_id", achievement_id)
          .maybeSingle();
        if (existing) return errorResponse("Already claimed");

        // Verify eligibility from profile stats
        const profile = await getProfile(admin, userId);
        const statValue = profile[requirement.stat];
        if (statValue === null || statValue === undefined)
          return errorResponse("Requirement not met");

        const comparator = requirement.comparator ?? "gte";
        const met = comparator === "lte"
          ? statValue <= requirement.value
          : statValue >= requirement.value;
        if (!met) return errorResponse("Requirement not met");

        // Insert achievement record
        const { error: achErr } = await admin
          .from("user_achievements")
          .insert({ user_id: userId, achievement_id });
        if (achErr) return errorResponse("Failed to claim achievement");

        // Award coins
        if (reward > 0) {
          await admin
            .from("profiles")
            .update({ coins: profile.coins + reward })
            .eq("user_id", userId);
        }

        return jsonResponse({ success: true, coins_awarded: reward });
      }

      // Server-verified tournament match result reporting
      case "report_match_result": {
        const { match_id, winner_id } = params;
        if (!match_id || !winner_id) return errorResponse("Missing match_id or winner_id");

        // Fetch the match
        const { data: match, error: matchErr } = await admin
          .from("tournament_matches")
          .select("*")
          .eq("id", match_id)
          .single();
        if (matchErr || !match) return errorResponse("Match not found");

        // Verify caller is a participant
        if (userId !== match.player1_id && userId !== match.player2_id)
          return errorResponse("You are not a participant in this match");

        // Verify winner_id is one of the two players
        if (winner_id !== match.player1_id && winner_id !== match.player2_id)
          return errorResponse("Invalid winner — must be a match participant");

        // Verify match is in ready state
        if (match.status !== "ready")
          return errorResponse("Match is not in ready state");

        // Update match result
        await admin
          .from("tournament_matches")
          .update({ winner_id, status: "finished", finished_at: new Date().toISOString() })
          .eq("id", match_id);

        // Eliminate loser
        const loserId = match.player1_id === winner_id ? match.player2_id : match.player1_id;
        if (loserId) {
          await admin
            .from("tournament_participants")
            .update({ eliminated: true })
            .eq("tournament_id", match.tournament_id)
            .eq("user_id", loserId);
        }

        // Advance winner to next round
        const nextRound = match.round + 1;
        const nextMatchIndex = Math.floor(match.match_index / 2);
        const isPlayer1 = match.match_index % 2 === 0;

        const { data: nextMatch } = await admin
          .from("tournament_matches")
          .select("*")
          .eq("tournament_id", match.tournament_id)
          .eq("round", nextRound)
          .eq("match_index", nextMatchIndex)
          .maybeSingle();

        if (nextMatch) {
          const update: Record<string, unknown> = {};
          if (isPlayer1) update.player1_id = winner_id;
          else update.player2_id = winner_id;

          const otherPlayer = isPlayer1 ? nextMatch.player2_id : nextMatch.player1_id;
          if (otherPlayer) update.status = "ready";

          await admin.from("tournament_matches").update(update).eq("id", nextMatch.id);
        } else {
          // Final match — award prize
          const { data: t } = await admin
            .from("tournaments")
            .select("prize_pool")
            .eq("id", match.tournament_id)
            .single();

          await admin
            .from("tournaments")
            .update({ winner_id, status: "finished", finished_at: new Date().toISOString() })
            .eq("id", match.tournament_id);

          if (t && t.prize_pool > 0) {
            const winnerProfile = await getProfile(admin, winner_id);
            await admin
              .from("profiles")
              .update({ coins: winnerProfile.coins + t.prize_pool })
              .eq("user_id", winner_id);
          }
        }

        return jsonResponse({ success: true });
      }

      // Server-side tournament refund (validates tournament context)
      case "tournament_refund": {
        const { tournament_id, amount } = params;
        if (!tournament_id || typeof amount !== "number" || amount <= 0 || amount > 10000)
          return errorResponse("Invalid parameters");

        // Verify the tournament exists and the user is the creator or a participant
        const { data: tournament } = await admin
          .from("tournaments")
          .select("id, created_by, entry_fee")
          .eq("id", tournament_id)
          .single();
        if (!tournament) return errorResponse("Tournament not found");

        // Verify amount matches entry fee
        if (amount > tournament.entry_fee)
          return errorResponse("Refund amount exceeds entry fee");

        // Verify user is creator or participant
        const isCreator = tournament.created_by === userId;
        const { data: participant } = await admin
          .from("tournament_participants")
          .select("id")
          .eq("tournament_id", tournament_id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!isCreator && !participant)
          return errorResponse("Not associated with this tournament");

        const profile = await getProfile(admin, userId);
        await admin
          .from("profiles")
          .update({ coins: profile.coins + amount })
          .eq("user_id", userId);

        return jsonResponse({ success: true, coins: profile.coins + amount });
      }

      case "use_diamond_token": {
        const profile = await getProfile(admin, userId);
        if (!profile.diamond_tokens || profile.diamond_tokens < 1)
          return errorResponse("No diamond tokens available");

        await admin
          .from("profiles")
          .update({ diamond_tokens: profile.diamond_tokens - 1 })
          .eq("user_id", userId);

        return jsonResponse({ success: true, diamond_tokens: profile.diamond_tokens - 1 });
      }

      case "claim_daily_reward": {
        // Daily reward tiers (Day 1-7, then repeats)
        const DAILY_REWARDS = [10, 20, 30, 40, 50, 75, 150];

        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

        const { data: existing } = await admin
          .from("daily_rewards")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existing && existing.last_claim_date === today) {
          return errorResponse("Already claimed today");
        }

        let streak = 1;
        if (existing) {
          const lastDate = new Date(existing.last_claim_date);
          const todayDate = new Date(today);
          const diffMs = todayDate.getTime() - lastDate.getTime();
          const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
          streak = diffDays === 1 ? existing.current_streak + 1 : 1;
        }

        const rewardIndex = ((streak - 1) % 7);
        const reward = DAILY_REWARDS[rewardIndex];

        if (existing) {
          await admin
            .from("daily_rewards")
            .update({ last_claim_date: today, current_streak: streak, total_claims: existing.total_claims + 1, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        } else {
          // Use service role to insert (no client INSERT policy needed)
          await admin
            .from("daily_rewards")
            .insert({ user_id: userId, last_claim_date: today, current_streak: streak, total_claims: 1 });
        }

        // Award coins
        const profile = await getProfile(admin, userId);
        await admin
          .from("profiles")
          .update({ coins: profile.coins + reward })
          .eq("user_id", userId);

        return jsonResponse({
          success: true,
          coins_awarded: reward,
          current_streak: streak,
          total_coins: profile.coins + reward,
        });
      }

      default:
        return errorResponse("Unknown action");
    }
  } catch (e) {
    console.error("Economy error:", e);
    return errorResponse("Internal error", 500);
  }
});
