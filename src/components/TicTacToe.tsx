import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, Monitor, Users, Trophy, Zap, Brain, Sparkles,
  Volume2, VolumeX, Undo2, Redo2, Eye, Shield, Timer, Menu, X,
  Crown, Flame, Target, Swords, Globe, LogIn, LogOut, User, Maximize, Minimize, ShoppingBag, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Player, Difficulty, BoardTheme, MoveRecord } from "./game/types";
import { BOARD_THEMES, POWERUP_COSTS, ACHIEVEMENT_DEFS } from "./game/types";
import { checkWinner, getAIMove, findBestMoveForPlayer, playSound } from "./game/engine";
import {
  getCoins, addCoinsToStorage, resetCoinsStorage,
  recordWin, recordLoss, recordDraw, addGameHistory,
  unlockAchievementStorage, getGameStats, checkDailyLogin, getPlayerName,
} from "./game/storage";
import Sidebar from "./game/Sidebar";
import { useMultiplayer } from "./game/useMultiplayer";
import MultiplayerLobby from "./game/MultiplayerLobby";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileSync } from "@/hooks/useProfileSync";
import { useChallenges } from "@/hooks/useChallenges";
import { useBattlePass } from "@/hooks/useBattlePass";
import ChallengeNotification from "./game/ChallengeNotification";
import { calculateXpGain, processXpGain, getLevelTitle, xpForLevel } from "./game/progression";
import GameChat, { type ChatMessage } from "./game/GameChat";

// ─── Confetti ──────────────────────────────────────────────────
function Confetti() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 2.5,
    color: [
      "hsl(265,90%,65%)", "hsl(165,80%,50%)", "hsl(48,100%,55%)",
      "hsl(330,85%,60%)", "hsl(200,85%,60%)", "hsl(45,100%,70%)",
    ][i % 6],
    size: 3 + Math.random() * 8,
    isCircle: Math.random() > 0.5,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: "110vh", opacity: 0, rotate: 720 * (Math.random() > 0.5 ? 1 : -1), scale: 0.3 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute", width: p.size, height: p.size * (p.isCircle ? 1 : 1.5),
            borderRadius: p.isCircle ? "50%" : "2px", backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Floating particles background ──────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 10 + Math.random() * 20,
    delay: Math.random() * 10,
    opacity: 0.1 + Math.random() * 0.15,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`, opacity: p.opacity }}
          animate={{ y: [0, -60, 0], x: [0, 20, -20, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── SVG Marks with enhanced animations ─────────────────────────
function XMark({ isWin, large }: { isWin: boolean; large?: boolean }) {
  return (
    <motion.svg viewBox="0 0 50 50" className={large ? "h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20" : "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"}
      initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}>
      <motion.line x1="12" y1="12" x2="38" y2="38"
        stroke={isWin ? "hsl(48,100%,55%)" : "url(#xGrad)"}
        strokeWidth="4.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.25 }}
        filter={isWin ? "drop-shadow(0 0 6px hsl(48,100%,55%))" : "drop-shadow(0 0 4px hsl(265,90%,62%))"}
      />
      <motion.line x1="38" y1="12" x2="12" y2="38"
        stroke={isWin ? "hsl(48,100%,55%)" : "url(#xGrad)"}
        strokeWidth="4.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        filter={isWin ? "drop-shadow(0 0 6px hsl(48,100%,55%))" : "drop-shadow(0 0 4px hsl(265,90%,62%))"}
      />
      <defs>
        <linearGradient id="xGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(265,90%,72%)" />
          <stop offset="100%" stopColor="hsl(290,85%,70%)" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

function OMark({ isWin, large }: { isWin: boolean; large?: boolean }) {
  return (
    <motion.svg viewBox="0 0 50 50" className={large ? "h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20" : "h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14"}
      initial={{ scale: 0, rotate: 180 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 12 }}>
      <motion.circle cx="25" cy="25" r="14" fill="none"
        stroke={isWin ? "hsl(48,100%,55%)" : "url(#oGrad)"}
        strokeWidth="4.5" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.35 }}
        filter={isWin ? "drop-shadow(0 0 6px hsl(48,100%,55%))" : "drop-shadow(0 0 4px hsl(165,80%,48%))"}
      />
      <defs>
        <linearGradient id="oGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(165,85%,55%)" />
          <stop offset="100%" stopColor="hsl(185,80%,50%)" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

// ─── XP Display ─────────────────────────────────────────────────
function XPDisplay({ totalWins }: { totalWins: number }) {
  const level = Math.floor(totalWins / 5) + 1;
  const xpInLevel = totalWins % 5;
  const xpPercent = (xpInLevel / 5) * 100;
  return (
    <div className="flex items-center gap-2 w-full max-w-[240px]">
      <div className="flex items-center gap-1">
        <Crown className="h-3 w-3 text-gold" />
        <span className="text-[10px] font-bold text-gold">Lv.{level}</span>
      </div>
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(265,90%,62%), hsl(290,85%,65%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${xpPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground font-mono">{xpInLevel}/5</span>
    </div>
  );
}

// ─── Turn indicator ─────────────────────────────────────────────
function TurnIndicator({ isXTurn, gameOver }: { isXTurn: boolean; gameOver: boolean }) {
  if (gameOver) return null;
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className={`h-2 w-2 rounded-full ${isXTurn ? "bg-x-color" : "bg-muted"}`}
        animate={isXTurn ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: isXTurn ? Infinity : 0 }}
      />
      <motion.div
        className={`h-2 w-2 rounded-full ${!isXTurn ? "bg-o-color" : "bg-muted"}`}
        animate={!isXTurn ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: !isXTurn ? Infinity : 0 }}
      />
    </div>
  );
}

type GameMode = "local" | "ai" | "online";

// ─── Main Component ─────────────────────────────────────────────
export default function TicTacToe() {
  const { user, signOut } = useAuth();
  const { syncGameResult, addCoinsToProfile } = useProfileSync();
  const { addBattlePassXp } = useBattlePass();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const challenges = useChallenges();
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState<GameMode>("local");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameOver, setGameOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [round, setRound] = useState(1);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [coinsX, setCoinsX] = useState(() => getCoins("X"));
  const [coinsO, setCoinsO] = useState(() => getCoins("O"));

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [redoStack, setRedoStack] = useState<MoveRecord[]>([]);
  const moveCountRef = useRef(0);

  const [peekCell, setPeekCell] = useState<number | null>(null);
  const [shieldedCells, setShieldedCells] = useState<Record<number, { player: "X" | "O"; turns: number }>>({});
  const [awaitingShield, setAwaitingShield] = useState(false);

  // Multiplayer
  const mp = useMultiplayer();
  const [showLobby, setShowLobby] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Listen for incoming chat messages
  useEffect(() => {
    mp.onChatRef.current = (text: string, id: string, isEmoji: boolean) => {
      setChatMessages((prev) => [...prev, { id, text, sender: "opponent", timestamp: Date.now(), isEmoji }]);
    };
  }, [mp.onChatRef]);

  const handleSendChat = useCallback((text: string) => {
    const isEmoji = /^\p{Emoji}$/u.test(text);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setChatMessages((prev) => [...prev, { id, text, sender: "me", timestamp: Date.now(), isEmoji }]);
    mp.sendChat(text, id, isEmoji);
  }, [mp]);

  // Tournament match tracking
  const tournamentIdRef = useRef<string | null>(null);
  const tournamentMatchIdRef = useRef<string | null>(null);

  // Handle URL-based challenge/join
  useEffect(() => {
    const joinCode = searchParams.get("join");
    const challengeUserId = searchParams.get("challenge");
    const tournamentId = searchParams.get("tournament");
    const matchId = searchParams.get("matchId");

    if (tournamentId) tournamentIdRef.current = tournamentId;
    if (matchId) tournamentMatchIdRef.current = matchId;

    if (joinCode) {
      setGameMode("online");
      setShowLobby(false);
      mp.joinRoom(joinCode);
      setSearchParams({}, { replace: true });
      toast(tournamentId ? "🏟️ Joining tournament match..." : "⚔️ Joining challenge match...");
    } else if (challengeUserId && user) {
      const code = mp.createRoom();
      setGameMode("online");
      setShowLobby(false);
      challenges.sendChallenge(challengeUserId, code);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vsAI = gameMode === "ai";
  const isOnline = gameMode === "online";
  const isMyTurn = isOnline ? (mp.state.myRole === "X" ? isXTurn : !isXTurn) : true;

  const { winner } = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const currentPlayer = isXTurn ? "X" : "O" as const;
  const stats = getGameStats();

  const refreshSidebar = () => setRefreshKey((k) => k + 1);

  const addCoins = useCallback((player: "X" | "O", amount: number) => {
    const updated = addCoinsToStorage(player, amount);
    if (player === "X") setCoinsX(updated);
    else setCoinsO(updated);
    if (amount > 0 && soundEnabled) playSound("coin", 0.08);
    refreshSidebar();
  }, [soundEnabled]);

  const checkAchievements = useCallback((elapsed: number = 0) => {
    const stats = getGameStats();
    const toasts: string[] = [];
    const tryUnlock = (id: string) => {
      if (unlockAchievementStorage(id)) {
        const def = ACHIEVEMENT_DEFS[id];
        toasts.push(`🎉 Achievement: ${def?.name || id}`);
        addCoins("X", 5);
        if (soundEnabled) playSound("achievement", 0.1);
      }
    };
    if (stats.wins >= 1) tryUnlock("first_win");
    if (stats.wins >= 5) tryUnlock("five_wins");
    if (stats.wins >= 10) tryUnlock("ten_wins");
    if (stats.wins >= 20) tryUnlock("twenty_wins");
    if (getCoins("X") >= 100) tryUnlock("coin_collector");
    if (elapsed > 0 && elapsed < 30) tryUnlock("speedster");
    toasts.forEach((msg) => toast(msg));
    refreshSidebar();
  }, [addCoins, soundEnabled]);

  useEffect(() => {
    if (!gameOver) {
      startTimeRef.current = Date.now();
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [round, gameOver]);

  useEffect(() => {
    const { isNew, bonus, streak } = checkDailyLogin();
    if (isNew && bonus > 0) {
      addCoins("X", bonus);
      toast(`📅 Daily Login Bonus: +${bonus} coins (streak: ${streak} days)`);
      if (streak >= 7) {
        if (unlockAchievementStorage("daily_login")) {
          toast("🎉 Achievement: Daily Login");
          addCoins("X", 5);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameOver) return;
    if (winner) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (timerRef.current) clearInterval(timerRef.current);
      setScore((s) => ({ ...s, [winner]: s[winner as "X" | "O"] + 1 }));
      setWinLine(checkWinner(board).line);
      setGameOver(true);
      setShowConfetti(true);
      if (soundEnabled) playSound("win", 0.1);
      setTimeout(() => setShowConfetti(false), 3500);
      let outcome: "win" | "loss" = "win";
      let mode = "pvp";
      let opponent = "Player";
      let shouldAwardCoins = false;

      if (isOnline) {
        const myWin = winner === mp.state.myRole;
        outcome = myWin ? "win" : "loss";
        if (myWin) recordWin(elapsed); else recordLoss();
        mode = "online"; opponent = "Online Player";
        // Award coins only to logged-in winner in online mode
        if (myWin && user) shouldAwardCoins = true;
      } else if (vsAI) {
        outcome = winner === "X" ? "win" : "loss";
        if (winner === "X") recordWin(elapsed); else recordLoss();
        mode = "ai"; opponent = `AI (${difficulty})`;
        // No coins in AI mode
      } else {
        // Local mode: award coins to logged-in user
        recordWin(elapsed);
        if (user) shouldAwardCoins = true;
      }

      if (shouldAwardCoins) {
        addCoinsToProfile(10);
        addCoins(winner, 10);
        toast(`🎉 ${getPlayerName(winner)} wins! +10 coins credited to your account`);
      } else {
        toast(`🎉 ${getPlayerName(winner)} wins!`);
      }
      addGameHistory({ outcome, time: elapsed, date: Date.now(), mode, opponent });

      // XP gain & database sync
      const xpGained = calculateXpGain(outcome, elapsed, vsAI ? difficulty : undefined);
      toast(`⚡ +${xpGained} XP`);
      syncGameResult(outcome, elapsed, xpGained).then((updated) => {
        if (updated && updated.level > (updated.level - 1)) {
          // Check for level-up by comparing with previous
        }
      });
      // Battle Pass XP on wins (Local & Online only)
      if (shouldAwardCoins && outcome === "win") {
        addBattlePassXp(xpGained);
      }

      checkAchievements(elapsed);
    } else if (isDraw) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (timerRef.current) clearInterval(timerRef.current);
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
      if (soundEnabled) playSound("draw", 0.06);
      recordDraw();
      addGameHistory({ outcome: "draw", time: elapsed, date: Date.now(), mode: isOnline ? "online" : vsAI ? "ai" : "pvp", opponent: isOnline ? "Online Player" : vsAI ? `AI (${difficulty})` : "Player" });

      const xpGained = calculateXpGain("draw", elapsed);
      toast(`⚡ +${xpGained} XP`);
      syncGameResult("draw", elapsed, xpGained);

      refreshSidebar();
    }
  }, [board, winner, isDraw, gameOver, soundEnabled, addCoins, vsAI, isOnline, difficulty, checkAchievements, mp.state.myRole]);

  // AI move
  useEffect(() => {
    if (vsAI && !isXTurn && !winner && !isDraw && !gameOver) {
      const timeout = setTimeout(() => {
        const move = getAIMove(board, difficulty);
        if (move !== undefined) doMove(move, true);
      }, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isXTurn, vsAI, board, winner, isDraw, difficulty, gameOver]);

  // Multiplayer: receive moves
  useEffect(() => {
    mp.onMoveRef.current = (index: number, player: "X" | "O", newBoard: Player[]) => {
      setBoard(newBoard);
      setIsXTurn(player === "X" ? false : true);
      moveCountRef.current += 1;
      setMoveHistory((h) => [...h, { index, player, moveNumber: moveCountRef.current, timestamp: Date.now() }]);
      setRedoStack([]);
      if (soundEnabled) playSound("place", 0.08);
    };
    mp.onResetRef.current = () => {
      resetBoard();
    };
    mp.onOpponentJoinRef.current = () => {
      toast("🎉 Opponent joined the room!");
    };
    mp.onOpponentLeaveRef.current = () => {
      toast("👋 Opponent left the room");
    };
  }, [soundEnabled, mp.onMoveRef, mp.onResetRef, mp.onOpponentJoinRef, mp.onOpponentLeaveRef]);

  // Auto-start game when opponent joins in online mode
  useEffect(() => {
    if (isOnline && mp.state.opponentJoined && showLobby) {
      const timer = setTimeout(() => setShowLobby(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, mp.state.opponentJoined, showLobby]);

  const doMove = useCallback((i: number, aiMove = false) => {
    if (board[i] || winner || isDraw || gameOver) return;
    if (vsAI && !isXTurn && !aiMove) return;
    if (isOnline && !isMyTurn && !aiMove) return;
    const shield = shieldedCells[i];
    if (shield && shield.player !== currentPlayer) { toast("🛡️ This cell is shielded!"); return; }
    const player = currentPlayer;
    const next = [...board];
    next[i] = player;
    moveCountRef.current += 1;
    setBoard(next);
    setIsXTurn(!isXTurn);
    setMoveHistory((h) => [...h, { index: i, player, moveNumber: moveCountRef.current, timestamp: Date.now() }]);
    setRedoStack([]);
    if (soundEnabled) playSound("place", 0.08);
    setPeekCell(null);
    setShieldedCells((prev) => {
      const updated: typeof prev = {};
      for (const [key, val] of Object.entries(prev)) {
        const t = val.turns - 1;
        if (t > 0) updated[Number(key)] = { ...val, turns: t };
      }
      return updated;
    });

    // Send move to opponent
    if (isOnline) {
      mp.sendMove(i, player, next);
    }
  }, [board, isXTurn, winner, isDraw, vsAI, isOnline, isMyTurn, currentPlayer, soundEnabled, shieldedCells, gameOver, mp]);

  const undoMove = useCallback(() => {
    if (moveHistory.length === 0 || gameOver || isOnline) return;
    const cost = 10;
    const playerCoins = currentPlayer === "X" ? coinsX : coinsO;
    if (playerCoins < cost) { toast(`Not enough coins (${cost} needed)`); return; }
    addCoins(currentPlayer, -cost);
    const last = moveHistory[moveHistory.length - 1];
    const newBoard = [...board];
    newBoard[last.index] = null;
    setBoard(newBoard);
    setIsXTurn(last.player === "X");
    setMoveHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [...r, last]);
    toast("↶ Move undone (-10 coins)");
  }, [moveHistory, gameOver, currentPlayer, coinsX, coinsO, addCoins, board, isOnline]);

  const redoMove = useCallback(() => {
    if (redoStack.length === 0 || gameOver || isOnline) return;
    const cost = 10;
    const playerCoins = currentPlayer === "X" ? coinsX : coinsO;
    if (playerCoins < cost) { toast(`Not enough coins (${cost} needed)`); return; }
    addCoins(currentPlayer, -cost);
    const move = redoStack[redoStack.length - 1];
    const newBoard = [...board];
    newBoard[move.index] = move.player;
    setBoard(newBoard);
    setIsXTurn(move.player === "X" ? false : true);
    setRedoStack((r) => r.slice(0, -1));
    setMoveHistory((h) => [...h, move]);
    toast("↷ Move redone (-10 coins)");
  }, [redoStack, gameOver, currentPlayer, coinsX, coinsO, addCoins, board, isOnline]);

  const usePeek = () => {
    if (isOnline) return;
    const cost = POWERUP_COSTS.peek;
    const coins = currentPlayer === "X" ? coinsX : coinsO;
    if (coins < cost) { toast(`Not enough coins (${cost})`); return; }
    if (gameOver) return;
    addCoins(currentPlayer, -cost);
    const best = findBestMoveForPlayer(board, currentPlayer);
    if (best !== null) { setPeekCell(best); setTimeout(() => setPeekCell(null), 2200); toast("🔍 Best move highlighted!"); }
  };

  const useShield = () => {
    if (gameOver || isOnline) return;
    toast("🛡️ Click an empty cell to place shield");
    setAwaitingShield(true);
    setTimeout(() => setAwaitingShield(false), 8000);
  };

  const handleCellClick = useCallback((i: number) => {
    if (awaitingShield) {
      if (board[i] !== null) { toast("Choose an empty cell"); return; }
      const cost = POWERUP_COSTS.shield;
      const coins = currentPlayer === "X" ? coinsX : coinsO;
      if (coins < cost) { toast(`Not enough coins (${cost})`); setAwaitingShield(false); return; }
      addCoins(currentPlayer, -cost);
      setShieldedCells((prev) => ({ ...prev, [i]: { player: currentPlayer, turns: 2 } }));
      setAwaitingShield(false);
      toast("🛡️ Shield placed!");
      return;
    }
    doMove(i);
  }, [awaitingShield, board, currentPlayer, coinsX, coinsO, addCoins, doMove]);

  const resetBoard = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinLine(null);
    setGameOver(false);
    setMoveHistory([]);
    setRedoStack([]);
    setShowConfetti(false);
    setPeekCell(null);
    setShieldedCells({});
    setAwaitingShield(false);
    moveCountRef.current = 0;
    setRound((r) => r + 1);
  }, []);

  const reset = () => {
    resetBoard();
    if (isOnline) mp.sendReset();
  };

  const resetAll = () => { resetBoard(); setScore({ X: 0, O: 0, draws: 0 }); setRound(1); };

  const switchMode = (mode: GameMode) => {
    if (isOnline) mp.leaveRoom();
    setGameMode(mode);
    setShowLobby(mode === "online");
    resetAll();
  };

  const handleCreateRoom = () => {
    const code = mp.createRoom();
    toast(`Room created: ${code}`);
    return code;
  };

  const handleJoinRoom = (code: string) => {
    const normalized = mp.joinRoom(code);
    toast(`Joining room ${normalized}...`);
    return normalized;
  };

  const handleLeaveRoom = () => {
    mp.leaveRoom();
    setShowLobby(true);
    resetAll();
  };

  const getStatusText = () => {
    if (winner) return `${getPlayerName(winner)} Wins!`;
    if (isDraw) return "It's a Draw!";
    if (isOnline) {
      return isMyTurn ? "Your Turn" : "Opponent's Turn";
    }
    return `${getPlayerName(currentPlayer)}'s Turn`;
  };

  const status = getStatusText();
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const movesMade = board.filter(Boolean).length;

  // Show lobby for online mode
  if (isOnline && showLobby) {
    return (
      <div className="relative flex min-h-screen animated-bg overflow-hidden items-center justify-center">
        <FloatingParticles />
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30 z-0" />
        <div className="z-10 flex flex-col items-center gap-6 p-4 w-full">
          <motion.div className="flex flex-col items-center gap-2" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary opacity-60" />
              <h1 className="text-3xl font-black tracking-tighter sm:text-5xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                <span className="text-gradient-title">TicTacToe</span>
              </h1>
              <Swords className="h-5 w-5 text-accent opacity-60" />
            </div>
          </motion.div>

          <MultiplayerLobby
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onLeave={() => switchMode("local")}
            roomCode={mp.state.roomCode}
            myRole={mp.state.myRole}
            opponentJoined={mp.state.opponentJoined}
            connected={mp.state.connected}
            isHost={mp.state.isHost}
          />

          <button
            onClick={() => switchMode("local")}
            className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            ← Back to Local Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex min-h-screen animated-bg overflow-hidden ${isFullscreen ? "fullscreen-game" : ""}`}>
      <FloatingParticles />
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-30 z-0" />

      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute top-[15%] left-[10%] h-80 w-80 rounded-full bg-primary/8 blur-[120px] z-0" />
      <div className="pointer-events-none absolute bottom-[15%] right-[10%] h-80 w-80 rounded-full bg-accent/6 blur-[120px] z-0" />
      <div className="pointer-events-none absolute top-[60%] left-[50%] h-48 w-48 rounded-full bg-gold/4 blur-[100px] z-0" />

      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* Challenge notification */}
      <AnimatePresence>
        {challenges.pendingChallenge && (
          <ChallengeNotification
            challengerName={challenges.pendingChallenge.challengerName}
            challengerAvatar={challenges.pendingChallenge.challengerAvatar}
            onAccept={() => challenges.acceptChallenge(challenges.pendingChallenge.id, challenges.pendingChallenge.room_code)}
            onDecline={() => challenges.declineChallenge(challenges.pendingChallenge.id)}
          />
        )}
      </AnimatePresence>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 sm:p-6 z-10 relative">

        {/* Title */}
        <motion.div className="flex flex-col items-center gap-2" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary opacity-60" />
            <h1 className="text-3xl font-black tracking-tighter sm:text-5xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span className="text-gradient-title">TicTacToe</span>
            </h1>
            <Swords className="h-5 w-5 text-accent opacity-60" />
          </div>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
            <span className="flex items-center gap-1"><Target className="h-3 w-3" /> Round {round}</span>
            <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatTime(elapsedTime)}</span>
            <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-streak" /> {stats.winStreak}</span>
            {isOnline && mp.state.roomCode && (
              <span className="flex items-center gap-1 text-accent"><Globe className="h-3 w-3" /> {mp.state.roomCode}</span>
            )}
          </div>
          <XPDisplay totalWins={stats.wins} />
        </motion.div>

        {/* Controls row */}
        <motion.div className="flex flex-wrap items-center justify-center gap-2" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          {/* Mode toggle buttons */}
          <div className="flex rounded-full overflow-hidden border border-border">
            <button onClick={() => switchMode("local")}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1
                ${gameMode === "local" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <Users className="h-3 w-3" /> Local
            </button>
            <button onClick={() => switchMode("ai")}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1
                ${gameMode === "ai" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <Monitor className="h-3 w-3" /> AI
            </button>
            <button onClick={() => switchMode("online")}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1
                ${gameMode === "online" ? "bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              <Globe className="h-3 w-3" /> Online
            </button>
          </div>

          {vsAI && (
            <motion.div className="flex rounded-full overflow-hidden border border-border" initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }}>
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button key={d} onClick={() => { setDifficulty(d); resetBoard(); }}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1
                    ${d === difficulty ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                  {d === "easy" ? <Zap className="h-3 w-3" /> : d === "medium" ? <Brain className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {d}
                </button>
              ))}
            </motion.div>
          )}

          <button onClick={() => setSoundEnabled(!soundEnabled)} className="glass-card rounded-full p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          <button onClick={() => setIsFullscreen(!isFullscreen)} className="glass-card rounded-full p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all" title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}>
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </button>

          {user ? (
            <button onClick={() => navigate("/profile")}
              className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
              <User className="h-3.5 w-3.5 text-accent" />
              <span className="hidden sm:inline max-w-[80px] truncate">{user.email?.split("@")[0]}</span>
            </button>
          ) : (
            <button onClick={() => navigate("/auth")}
              className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
              <LogIn className="h-3.5 w-3.5 text-primary" /> Sign In
            </button>
          )}

          <button onClick={() => navigate("/leaderboard")}
            className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <Trophy className="h-3.5 w-3.5 text-[hsl(var(--gold))]" /> Leaderboard
          </button>

          <button onClick={() => navigate("/shop")}
            className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <ShoppingBag className="h-3.5 w-3.5 text-primary" /> Shop
          </button>

          <button onClick={() => navigate("/friends")}
            className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <UserPlus className="h-3.5 w-3.5 text-accent" /> Friends
          </button>

          <button onClick={() => navigate("/battlepass")}
            className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--gold))]" /> Battle Pass
          </button>

          <button onClick={() => navigate("/tournament")}
            className="glass-card flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-all">
            <Trophy className="h-3.5 w-3.5 text-[hsl(var(--streak))]" /> Tournaments
          </button>

          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="glass-card rounded-full p-2 text-muted-foreground hover:text-foreground active:scale-95 lg:hidden transition-all">
            {sidebarOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </button>
        </motion.div>

        {/* Online mode: connection indicator */}
        {isOnline && (
          <motion.div
            className="flex items-center gap-2 text-[10px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${mp.state.connected ? "bg-accent" : "bg-destructive"} animate-pulse`} />
            <span className="text-muted-foreground">
              {mp.state.connected ? `Playing as ${mp.state.myRole}` : "Connecting..."}
            </span>
            {mp.state.roomCode && (
              <button onClick={handleLeaveRoom} className="text-destructive/60 hover:text-destructive transition-colors ml-2 underline">
                Leave
              </button>
            )}
          </motion.div>
        )}

        {/* Scoreboard */}
        <motion.div className="glass-card-elevated flex items-stretch rounded-2xl overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: "spring" }}>
          {/* Player X */}
          <div className={`flex flex-col items-center px-5 py-3 border-r border-border/30 transition-all ${isXTurn && !gameOver ? "bg-x-color/5" : ""}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <motion.div className={`h-2 w-2 rounded-full bg-x-color`} animate={isXTurn && !gameOver ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isOnline && mp.state.myRole === "X" ? "You (X)" : getPlayerName("X")}
              </span>
            </div>
            <motion.span key={`x-${score.X}`} className="text-2xl font-black text-gradient-x" style={{ fontFamily: "'JetBrains Mono'" }} initial={{ scale: 1.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}>
              {score.X}
            </motion.span>
            <span className="text-[9px] text-muted-foreground font-mono">🪙 {coinsX}</span>
          </div>

          {/* Draws */}
          <div className="flex flex-col items-center justify-center px-4 py-3 border-r border-border/30">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Draws</span>
            <motion.span key={`d-${score.draws}`} className="text-xl font-bold text-muted-foreground" style={{ fontFamily: "'JetBrains Mono'" }} initial={{ scale: 1.3 }} animate={{ scale: 1 }}>
              {score.draws}
            </motion.span>
            <span className="text-[9px] text-muted-foreground">{movesMade} moves</span>
          </div>

          {/* Player O */}
          <div className={`flex flex-col items-center px-5 py-3 transition-all ${!isXTurn && !gameOver ? "bg-o-color/5" : ""}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <motion.div className={`h-2 w-2 rounded-full bg-o-color`} animate={!isXTurn && !gameOver ? { scale: [1, 1.5, 1] } : {}} transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {isOnline && mp.state.myRole === "O" ? "You (O)" : getPlayerName("O")}
              </span>
            </div>
            <motion.span key={`o-${score.O}`} className="text-2xl font-black text-gradient-o" style={{ fontFamily: "'JetBrains Mono'" }} initial={{ scale: 1.5, rotate: 10 }} animate={{ scale: 1, rotate: 0 }}>
              {score.O}
            </motion.span>
            <span className="text-[9px] text-muted-foreground font-mono">🪙 {coinsO}</span>
          </div>
        </motion.div>

        {/* Status + Turn indicator */}
        <div className="flex flex-col items-center gap-2">
          <TurnIndicator isXTurn={isXTurn} gameOver={gameOver} />
          <AnimatePresence mode="wait">
            <motion.div key={status}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-2 text-sm font-bold
                ${winner ? "glass-card-elevated glow-win text-win-highlight" : isDraw ? "glass-card text-muted-foreground" : isOnline && !isMyTurn ? "glass-card text-muted-foreground/60" : "text-foreground"}`}
              initial={{ y: -15, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 15, opacity: 0, scale: 0.9 }}>
              {winner && <Trophy className="h-4 w-4" />}
              {status}
              {winner && <span className="text-lg">🎉</span>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Board */}
        <motion.div className={`glass-card-elevated rounded-3xl board-glow ${isFullscreen ? "p-6 sm:p-8" : "p-4 sm:p-5"} ${isOnline && !isMyTurn && !gameOver ? "opacity-80" : ""}`}
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 120 }}>
          <div className={`grid grid-cols-3 ${isFullscreen ? "gap-3 sm:gap-4" : "gap-2.5 sm:gap-3"}`}>
            {board.map((cell, i) => {
              const isWinCell = winLine?.includes(i);
              const isPeek = peekCell === i;
              const isShielded = !!shieldedCells[i];
              const row = Math.floor(i / 3);
              const col = i % 3;
              const canClick = !cell && !winner && !isDraw && !gameOver && (isOnline ? isMyTurn : true);
              return (
                <motion.button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  whileHover={canClick ? { scale: 1.06, y: -2 } : {}}
                  whileTap={canClick ? { scale: 0.94 } : {}}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: row * 0.06 + col * 0.06, type: "spring", stiffness: 200 }}
                  className={`relative flex items-center justify-center rounded-2xl transition-all duration-300
                    ${isFullscreen
                      ? "h-[100px] w-[100px] sm:h-[130px] sm:w-[130px] md:h-[150px] md:w-[150px]"
                      : "h-[72px] w-[72px] sm:h-[88px] sm:w-[88px] md:h-[96px] md:w-[96px]"
                    }
                    ${isWinCell
                      ? "bg-win-highlight/12 glow-win border-2 border-win-highlight/40"
                      : isPeek
                      ? "bg-win-highlight/8 border-2 border-win-highlight/30 animate-pulse"
                      : isShielded
                      ? "bg-primary/8 border-2 border-dashed border-primary/30"
                      : cell === "X"
                      ? "bg-x-color/6 border-2 border-x-color/15 glow-x"
                      : cell === "O"
                      ? "bg-o-color/6 border-2 border-o-color/15 glow-o"
                      : canClick
                      ? "bg-secondary/40 border-2 border-border/40 hover:bg-cell-hover hover:border-primary/30 cursor-pointer"
                      : "bg-secondary/40 border-2 border-border/40 cursor-default opacity-60"
                    }
                  `}
                  disabled={!canClick}
                >
                  <AnimatePresence>
                    {cell === "X" && <XMark isWin={!!isWinCell} large={isFullscreen} />}
                    {cell === "O" && <OMark isWin={!!isWinCell} large={isFullscreen} />}
                  </AnimatePresence>
                  {isShielded && (
                    <motion.span className="absolute top-1 right-1.5 text-xs" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }}>🛡️</motion.span>
                  )}
                  {isPeek && !cell && (
                    <motion.span className="text-lg" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}>💡</motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Power-ups row — hidden in online mode */}
        {!isOnline && (
          <motion.div className="flex flex-wrap gap-2 justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <button onClick={usePeek} disabled={gameOver}
              className="glass-card flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all active:scale-95 disabled:opacity-30">
              <Eye className="h-3.5 w-3.5 text-gold" /> Peek
              <span className="text-[9px] text-muted-foreground/70 ml-0.5">{POWERUP_COSTS.peek}🪙</span>
            </button>
            <button onClick={useShield} disabled={gameOver}
              className="glass-card flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all active:scale-95 disabled:opacity-30">
              <Shield className="h-3.5 w-3.5 text-primary" /> Shield
              <span className="text-[9px] text-muted-foreground/70 ml-0.5">{POWERUP_COSTS.shield}🪙</span>
            </button>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div className="flex items-center gap-2.5" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
          {!isOnline && (
            <button onClick={undoMove} disabled={moveHistory.length === 0 || gameOver}
              className="glass-card flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-25">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
          )}
          <button onClick={reset}
            className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground glow-primary transition-all hover:brightness-110 active:scale-95">
            <RotateCcw className="h-4 w-4" /> Play Again
          </button>
          {!isOnline && (
            <button onClick={redoMove} disabled={redoStack.length === 0 || gameOver}
              className="glass-card flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-25">
              <Redo2 className="h-3.5 w-3.5" /> Redo
            </button>
          )}
        </motion.div>

        {!isOnline && (
          <button onClick={resetAll} className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            Reset Everything
          </button>
        )}

        {isOnline && (
          <button onClick={handleLeaveRoom} className="text-[10px] text-destructive/50 hover:text-destructive transition-colors">
            Leave Room
          </button>
        )}

        {/* In-game chat (online only) */}
        {isOnline && mp.state.connected && (
          <GameChat messages={chatMessages} onSend={handleSendChat} myRole={mp.state.myRole} />
        )}
      </div>

      {/* Desktop sidebar — hidden in fullscreen */}
      {!isFullscreen && (
        <div className="hidden lg:block w-[280px] border-l border-border/30 bg-card/20 backdrop-blur-sm p-4 overflow-y-auto max-h-screen z-10">
          <Sidebar coinsX={coinsX} coinsO={coinsO} boardTheme={boardTheme} setBoardTheme={setBoardTheme}
            difficulty={difficulty} setDifficulty={(d) => { setDifficulty(d); resetBoard(); }}
            soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
            vsAI={vsAI} refreshKey={refreshKey} />
        </div>
      )}

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-card/95 backdrop-blur-xl border-l border-border/50 z-40 p-4 overflow-y-auto lg:hidden">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1">
              <X className="h-5 w-5" />
            </button>
            <div className="mt-8">
              <Sidebar coinsX={coinsX} coinsO={coinsO} boardTheme={boardTheme} setBoardTheme={setBoardTheme}
                difficulty={difficulty} setDifficulty={(d) => { setDifficulty(d); resetBoard(); }}
                soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
                vsAI={vsAI} refreshKey={refreshKey} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
