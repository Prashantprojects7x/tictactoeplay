import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Copy, Check, LogIn, PlusCircle, Wifi, WifiOff, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCreateRoom: () => string;
  onJoinRoom: (code: string) => string;
  onLeave: () => void;
  roomCode: string | null;
  myRole: "X" | "O" | null;
  opponentJoined: boolean;
  connected: boolean;
  isHost: boolean;
}

export default function MultiplayerLobby({ onCreateRoom, onJoinRoom, onLeave, roomCode, myRole, opponentJoined, connected, isHost }: Props) {
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast("Room code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Not in a room yet — show create/join options
  if (!roomCode) {
    return (
      <motion.div
        className="glass-card-elevated rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Globe className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Online Multiplayer</h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={onCreateRoom}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground glow-primary transition-all hover:brightness-110 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            Create Room
          </button>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
            <div className="flex-1 h-px bg-border" />
            <span>or join</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
              placeholder="ROOM CODE"
              maxLength={5}
              className="flex-1 rounded-xl bg-secondary/60 border border-border/50 px-4 py-3 text-center text-sm font-mono font-bold tracking-[0.3em] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
            <button
              onClick={() => {
                if (joinCode.length < 3) {
                  toast("Enter a valid room code");
                  return;
                }
                onJoinRoom(joinCode);
              }}
              disabled={joinCode.length < 3}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition-all hover:brightness-110 active:scale-95 disabled:opacity-40"
            >
              <LogIn className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // In a room — waiting for opponent or ready
  return (
    <motion.div
      className="glass-card-elevated rounded-3xl p-6 max-w-sm w-full mx-auto"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={onLeave} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-accent" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className="text-[10px] font-medium text-muted-foreground">
            {connected ? "Connected" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Room code display */}
      <div className="text-center mb-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5">Room Code</p>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-2 rounded-2xl bg-secondary/60 border border-border/50 px-6 py-3 transition-all hover:border-primary/40 active:scale-95"
        >
          <span className="text-2xl font-black tracking-[0.4em] text-foreground font-mono">{roomCode}</span>
          {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
        </button>
        <p className="text-[10px] text-muted-foreground mt-2">Share this code with your opponent</p>
      </div>

      {/* Player info */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-black mx-auto mb-1 ${myRole === "X" ? "bg-x-color/15 text-x-color border border-x-color/30" : "bg-o-color/15 text-o-color border border-o-color/30"}`}>
            {myRole}
          </div>
          <span className="text-[9px] text-muted-foreground font-medium">You</span>
        </div>

        <span className="text-muted-foreground/40 text-lg font-bold">vs</span>

        <div className="text-center">
          <AnimatePresence mode="wait">
            {opponentJoined ? (
              <motion.div
                key="joined"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-black mx-auto mb-1 ${myRole === "X" ? "bg-o-color/15 text-o-color border border-o-color/30" : "bg-x-color/15 text-x-color border border-x-color/30"}`}
              >
                {myRole === "X" ? "O" : "X"}
              </motion.div>
            ) : (
              <motion.div
                key="waiting"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-10 w-10 rounded-xl flex items-center justify-center text-lg mx-auto mb-1 bg-secondary/60 border border-border/50 text-muted-foreground/40"
              >
                ?
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-[9px] text-muted-foreground font-medium">
            {opponentJoined ? "Ready" : "Waiting..."}
          </span>
        </div>
      </div>

      {opponentJoined && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-xs text-accent font-semibold"
        >
          ✨ Opponent joined! Game starting...
        </motion.p>
      )}

      {!opponentJoined && isHost && (
        <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
          Waiting for someone to join with your room code
        </p>
      )}
    </motion.div>
  );
}
