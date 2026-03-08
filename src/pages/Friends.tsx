import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, UserPlus, Users, Copy, Check, Swords, Crown, X as XIcon,
  Clock, UserMinus, Search, Inbox, Send,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends, type Friendship } from "@/hooks/useFriends";

export default function Friends() {
  const { user } = useAuth();
  const {
    friends, pendingReceived, pendingSent, loading, myFriendCode,
    sendRequest, acceptRequest, declineRequest, removeFriend,
  } = useFriends();

  const [friendCode, setFriendCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<"friends" | "requests">("friends");

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <Users className="w-12 h-12 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground font-medium">Sign in to manage friends</p>
        <Link to="/auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold text-sm">
          Sign In
        </Link>
      </div>
    );
  }

  const copyCode = () => {
    if (myFriendCode) {
      navigator.clipboard.writeText(myFriendCode);
      setCopied(true);
      toast("Friend code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!friendCode.trim()) return;
    setSending(true);
    await sendRequest(friendCode);
    setFriendCode("");
    setSending(false);
  };

  const requestCount = pendingReceived.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium text-sm">Back to Game</span>
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="font-[JetBrains_Mono] text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              👥 Friends
            </span>
          </h1>
        </motion.div>

        {/* My friend code */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border/50 rounded-2xl p-4 mb-4"
        >
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 text-center">Your Friend Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xl font-black tracking-[0.3em] font-mono text-foreground">{myFriendCode || "..."}</span>
            <button onClick={copyCode} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-all active:scale-95">
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">Share this code with friends so they can add you</p>
        </motion.div>

        {/* Add friend input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase().slice(0, 8))}
              placeholder="Enter friend code"
              maxLength={8}
              className="w-full rounded-xl bg-secondary/60 border border-border/50 pl-10 pr-4 py-3 text-sm font-mono font-bold tracking-wider text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={friendCode.length < 4 || sending}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("friends")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "friends" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Users className="w-4 h-4" /> Friends ({friends.length})
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "requests" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <Inbox className="w-4 h-4" /> Requests
            {requestCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {requestCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : tab === "friends" ? (
          <FriendsList friends={friends} onRemove={removeFriend} />
        ) : (
          <RequestsList
            received={pendingReceived}
            sent={pendingSent}
            onAccept={acceptRequest}
            onDecline={declineRequest}
          />
        )}
      </div>
    </div>
  );
}

function FriendsList({ friends, onRemove }: { friends: Friendship[]; onRemove: (id: string) => void }) {
  if (friends.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-sm">No friends yet</p>
        <p className="text-xs mt-1">Share your friend code to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence>
        {friends.map((f, i) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-4 py-3"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
              {f.friend?.avatar_url || "🎮"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{f.friend?.display_name || "Player"}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><Crown className="w-3 h-3" /> Lv.{f.friend?.level ?? 1}</span>
                <span>{f.friend?.total_wins ?? 0} wins</span>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Link
                to={`/?challenge=${f.friend?.user_id}`}
                className="flex items-center gap-1 bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-[10px] font-bold hover:brightness-110 transition-all active:scale-95"
              >
                <Swords className="w-3 h-3" /> Challenge
              </Link>
              <button
                onClick={() => onRemove(f.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              >
                <UserMinus className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function RequestsList({
  received, sent, onAccept, onDecline,
}: {
  received: Friendship[];
  sent: Friendship[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Received */}
      {received.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Inbox className="w-3 h-3" /> Received ({received.length})
          </p>
          <div className="flex flex-col gap-2">
            {received.map((f) => (
              <div key={f.id} className="flex items-center gap-3 bg-card border border-border/50 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                  {f.friend?.avatar_url || "🎮"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{f.friend?.display_name || "Player"}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => onAccept(f.id)}
                    className="bg-accent text-accent-foreground px-3 py-1.5 rounded-lg text-[10px] font-bold hover:brightness-110 transition-all active:scale-95">
                    Accept
                  </button>
                  <button onClick={() => onDecline(f.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent */}
      {sent.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Send className="w-3 h-3" /> Sent ({sent.length})
          </p>
          <div className="flex flex-col gap-2">
            {sent.map((f) => (
              <div key={f.id} className="flex items-center gap-3 bg-card/50 border border-border/30 rounded-xl px-4 py-3 opacity-70">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                  {f.friend?.avatar_url || "🎮"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{f.friend?.display_name || "Player"}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting response
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {received.length === 0 && sent.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">No pending requests</p>
        </div>
      )}
    </div>
  );
}
