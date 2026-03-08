import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FriendProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  level: number;
  total_wins: number;
  friend_code: string | null;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  friend: FriendProfile | null;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [myFriendCode, setMyFriendCode] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Get my friend code
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("friend_code")
      .eq("user_id", user.id)
      .single();
    if (myProfile) setMyFriendCode((myProfile as any).friend_code);

    // Get all friendships
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    if (!friendships) { setLoading(false); return; }

    // Get friend user IDs
    const friendUserIds = friendships.map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    // Fetch friend profiles
    let profilesMap: Record<string, FriendProfile> = {};
    if (friendUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, level, total_wins, friend_code")
        .in("user_id", friendUserIds);
      if (profiles) {
        for (const p of profiles) {
          profilesMap[p.user_id] = p as FriendProfile;
        }
      }
    }

    const enriched: Friendship[] = friendships.map((f) => {
      const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      return { ...f, friend: profilesMap[friendId] || null };
    });

    setFriends(enriched.filter((f) => f.status === "accepted"));
    setPendingReceived(enriched.filter((f) => f.status === "pending" && f.addressee_id === user.id));
    setPendingSent(enriched.filter((f) => f.status === "pending" && f.requester_id === user.id));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  const sendRequest = useCallback(async (friendCode: string) => {
    if (!user) { toast("Sign in to add friends"); return false; }

    const code = friendCode.trim().toUpperCase();
    if (code === myFriendCode) { toast("That's your own code!"); return false; }

    // Find user by friend code
    const { data: target } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("friend_code", code)
      .single();

    if (!target) { toast("Player not found"); return false; }

    // Check existing
    const { data: existing } = await supabase
      .from("friendships")
      .select("id")
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${target.user_id}),and(requester_id.eq.${target.user_id},addressee_id.eq.${user.id})`);

    if (existing && existing.length > 0) { toast("Friend request already exists"); return false; }

    const { error } = await supabase
      .from("friendships")
      .insert({ requester_id: user.id, addressee_id: target.user_id });

    if (error) { toast("Failed to send request"); return false; }

    toast("🤝 Friend request sent!");
    await fetchFriends();
    return true;
  }, [user, myFriendCode, fetchFriends]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);
    toast("✅ Friend added!");
    await fetchFriends();
  }, [fetchFriends]);

  const declineRequest = useCallback(async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);
    toast("Request declined");
    await fetchFriends();
  }, [fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    toast("Friend removed");
    await fetchFriends();
  }, [fetchFriends]);

  return {
    friends, pendingReceived, pendingSent, loading, myFriendCode,
    sendRequest, acceptRequest, declineRequest, removeFriend, refresh: fetchFriends,
  };
}
