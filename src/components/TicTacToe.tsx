import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, Monitor, Users, Trophy, Zap, Brain, Sparkles,
  Volume2, VolumeX, Undo2, Redo2, Eye, Shield, BoltIcon, Timer, Menu, X,
} from "lucide-react";
import { toast } from "sonner";
import type { Player, Difficulty, BoardTheme, MoveRecord } from "./game/types";
import { BOARD_THEMES, POWERUP_COSTS, ACHIEVEMENT_DEFS } from "./game/types";
import { checkWinner, getAIMove, findBestMoveForPlayer, playSound } from "./game/engine";
import {
  getCoins, addCoinsToStorage, resetCoinsStorage,
  recordWin, recordLoss, recordDraw, addGameHistory,
  unlockAchievementStorage, getGameStats, checkDailyLogin, getPlayerName,
} from "./game/storage";
import Sidebar from "./game/Sidebar";

// ─── Confetti ──────────────────────────────────────────────────
function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.5 + Math.random() * 2,
    color: ["hsl(260,85%,65%)", "hsl(170,75%,50%)", "hsl(45,95%,55%)", "hsl(330,80%,60%)", "hsl(200,80%,60%)"][i % 5],
    size: 4 + Math.random() * 6,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: 360 + Math.random() * 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{ position: "absolute", width: p.size, height: p.size, borderRadius: p.size > 7 ? "50%" : "2px", backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ─── SVG Marks ──────────────────────────────────────────────────
function XMark({ isWin }: { isWin: boolean }) {
  return (
    <motion.svg viewBox="0 0 50 50" className={`h-12 w-12 sm:h-14 sm:w-14 ${isWin ? "drop-shadow-[0_0_8px_hsl(45,95%,55%)]" : ""}`}
      initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}>
      <motion.line x1="10" y1="10" x2="40" y2="40" stroke={isWin ? "hsl(45,95%,55%)" : "hsl(260,85%,70%)"} strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3 }} />
      <motion.line x1="40" y1="10" x2="10" y2="40" stroke={isWin ? "hsl(45,95%,55%)" : "hsl(260,85%,70%)"} strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 }} />
    </motion.svg>
  );
}

function OMark({ isWin }: { isWin: boolean }) {
  return (
    <motion.svg viewBox="0 0 50 50" className={`h-12 w-12 sm:h-14 sm:w-14 ${isWin ? "drop-shadow-[0_0_8px_hsl(45,95%,55%)]" : ""}`}
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}>
      <motion.circle cx="25" cy="25" r="15" stroke={isWin ? "hsl(45,95%,55%)" : "hsl(170,75%,50%)"} strokeWidth="4" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4 }} />
    </motion.svg>
  );
}

// ─── Main Component ─────────────────────────────────────────────
export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [vsAI, setVsAI] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameOver, setGameOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [round, setRound] = useState(1);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>("default");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Coins (local state synced with storage)
  const [coinsX, setCoinsX] = useState(() => getCoins("X"));
  const [coinsO, setCoinsO] = useState(() => getCoins("O"));

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Move history for undo/redo
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [redoStack, setRedoStack] = useState<MoveRecord[]>([]);
  const moveCountRef = useRef(0);

  // Peek highlight
  const [peekCell, setPeekCell] = useState<number | null>(null);

  // Shield cells
  const [shieldedCells, setShieldedCells] = useState<Record<number, { player: "X" | "O"; turns: number }>>({});

  const { winner } = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);
  const currentPlayer = isXTurn ? "X" : "O" as const;

  const refreshSidebar = () => setRefreshKey((k) => k + 1);

  // Add coins helper
  const addCoins = useCallback((player: "X" | "O", amount: number) => {
    const updated = addCoinsToStorage(player, amount);
    if (player === "X") setCoinsX(updated);
    else setCoinsO(updated);
    if (amount > 0 && soundEnabled) playSound("coin", 0.08);
    refreshSidebar();
  }, [soundEnabled]);

  // Check achievements
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

  // Timer
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

  // Daily login bonus
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

  // End-of-game
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

      // Award coins + record
      addCoins(winner, 10);
      toast(`🎉 ${getPlayerName(winner)} wins! +10 coins`);

      if (winner === "X" || !vsAI) {
        recordWin(elapsed);
      } else {
        recordLoss();
      }
      addGameHistory({
        outcome: vsAI && winner === "O" ? "loss" : "win",
        time: elapsed,
        date: Date.now(),
        mode: vsAI ? "ai" : "pvp",
        opponent: vsAI ? `AI (${difficulty})` : "Player",
      });
      checkAchievements(elapsed);
    } else if (isDraw) {
      if (timerRef.current) clearInterval(timerRef.current);
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
      if (soundEnabled) playSound("draw", 0.06);
      recordDraw();
      addGameHistory({
        outcome: "draw",
        time: Math.floor((Date.now() - startTimeRef.current) / 1000),
        date: Date.now(),
        mode: vsAI ? "ai" : "pvp",
        opponent: vsAI ? `AI (${difficulty})` : "Player",
      });
      refreshSidebar();
    }
  }, [board, winner, isDraw, gameOver, soundEnabled, addCoins, vsAI, difficulty, checkAchievements]);

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

  const doMove = useCallback((i: number, aiMove = false) => {
    if (board[i] || winner || isDraw || gameOver) return;
    if (vsAI && !isXTurn && !aiMove) return;

    // Check shield
    const shield = shieldedCells[i];
    if (shield && shield.player !== currentPlayer) {
      toast("🛡️ This cell is shielded!");
      return;
    }

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

    // Decay shields
    setShieldedCells((prev) => {
      const updated: typeof prev = {};
      for (const [key, val] of Object.entries(prev)) {
        const t = val.turns - 1;
        if (t > 0) updated[Number(key)] = { ...val, turns: t };
      }
      return updated;
    });
  }, [board, isXTurn, winner, isDraw, vsAI, currentPlayer, soundEnabled, shieldedCells, gameOver]);

  // Undo
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0 || gameOver) return;
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
  }, [moveHistory, gameOver, currentPlayer, coinsX, coinsO, addCoins, board]);

  // Redo
  const redoMove = useCallback(() => {
    if (redoStack.length === 0 || gameOver) return;
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
  }, [redoStack, gameOver, currentPlayer, coinsX, coinsO, addCoins, board]);

  // Powerups
  const usePeek = () => {
    const cost = POWERUP_COSTS.peek;
    const coins = currentPlayer === "X" ? coinsX : coinsO;
    if (coins < cost) { toast(`Not enough coins (${cost})`); return; }
    if (gameOver) return;
    addCoins(currentPlayer, -cost);
    const best = findBestMoveForPlayer(board, currentPlayer);
    if (best !== null) {
      setPeekCell(best);
      setTimeout(() => setPeekCell(null), 2200);
      toast("🔍 Best move highlighted!");
    }
  };

  const useShield = () => {
    toast("🛡️ Click an empty cell to place shield");
    // We'll handle this via a state flag
    setAwaitingShield(true);
    setTimeout(() => setAwaitingShield(false), 8000);
  };

  const [awaitingShield, setAwaitingShield] = useState(false);

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

  const reset = () => {
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
  };

  const resetAll = () => {
    reset();
    setScore({ X: 0, O: 0, draws: 0 });
    setRound(1);
  };

  const toggleMode = () => {
    setVsAI(!vsAI);
    resetAll();
  };

  const status = winner
    ? `${getPlayerName(winner)} Wins!`
    : isDraw
    ? "It's a Draw!"
    : `${getPlayerName(currentPlayer)}'s Turn`;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const theme = BOARD_THEMES[boardTheme];

  return (
    <div className="relative flex min-h-screen bg-background bg-grid-pattern overflow-hidden">
      {/* Background orbs */}
      <div className="pointer-events-none absolute top-1/4 -left-32 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 h-64 w-64 rounded-full bg-accent/10 blur-[100px]" />

      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        {/* Header */}
        <motion.div className="flex flex-col items-center gap-1" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground sm:text-5xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            <span className="text-gradient-x">Tic</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-gradient-o">Tac</span>
            <span className="text-muted-foreground">-</span>
            <span className="text-foreground">Toe</span>
          </h1>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
            <span>Round {round}</span>
            <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {formatTime(elapsedTime)}</span>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button onClick={toggleMode} className="glass-card flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-card-foreground transition-all hover:border-primary/50 active:scale-95">
            {vsAI ? <Monitor className="h-3.5 w-3.5 text-primary" /> : <Users className="h-3.5 w-3.5 text-accent" />}
            {vsAI ? "vs AI" : "vs Human"}
          </button>

          {vsAI && (
            <div className="flex">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); reset(); }}
                  className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all first:rounded-l-full last:rounded-r-full border border-border
                    ${d === difficulty ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:text-foreground"}`}
                >
                  {d === "easy" ? <Zap className="h-3 w-3 inline mr-0.5" /> : d === "medium" ? <Brain className="h-3 w-3 inline mr-0.5" /> : <Sparkles className="h-3 w-3 inline mr-0.5" />}
                  {d}
                </button>
              ))}
            </div>
          )}

          <button onClick={() => setSoundEnabled(!soundEnabled)} className="glass-card rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95">
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          {/* Mobile sidebar toggle */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="glass-card rounded-full p-1.5 text-muted-foreground hover:text-foreground active:scale-95 lg:hidden">
            {sidebarOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Scoreboard */}
        <motion.div className="glass-card flex items-stretch gap-0 rounded-2xl overflow-hidden" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="flex flex-col items-center px-4 py-2 border-r border-border/50">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🪙 {coinsX}</span>
            <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-x-color" /><span className="text-[10px] text-muted-foreground">{getPlayerName("X")}</span></div>
            <span className="text-xl font-bold text-gradient-x" style={{ fontFamily: "'JetBrains Mono'" }}>{score.X}</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 border-r border-border/50">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Draws</span>
            <span className="text-xl font-bold text-muted-foreground" style={{ fontFamily: "'JetBrains Mono'" }}>{score.draws}</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">🪙 {coinsO}</span>
            <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-o-color" /><span className="text-[10px] text-muted-foreground">{getPlayerName("O")}</span></div>
            <span className="text-xl font-bold text-gradient-o" style={{ fontFamily: "'JetBrains Mono'" }}>{score.O}</span>
          </div>
        </motion.div>

        {/* Status */}
        <AnimatePresence mode="wait">
          <motion.div key={status}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold
              ${winner ? "glass-card glow-win text-win-highlight" : isDraw ? "glass-card text-muted-foreground" : "text-foreground"}`}
            initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }}>
            {winner && <Trophy className="h-4 w-4" />}
            {status}
            {winner && " 🎉"}
          </motion.div>
        </AnimatePresence>

        {/* Board */}
        <motion.div className="glass-card rounded-3xl p-3 sm:p-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 150 }}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {board.map((cell, i) => {
              const isWinCell = winLine?.includes(i);
              const isPeek = peekCell === i;
              const isShielded = !!shieldedCells[i];
              return (
                <motion.button
                  key={i}
                  onClick={() => handleCellClick(i)}
                  whileHover={!cell && !winner && !isDraw ? { scale: 1.05 } : {}}
                  whileTap={!cell && !winner && !isDraw ? { scale: 0.95 } : {}}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 sm:h-24 sm:w-24
                    ${isWinCell
                      ? "bg-win-highlight/15 glow-win border-2 border-win-highlight/50"
                      : isPeek
                      ? "bg-win-highlight/10 border-2 border-win-highlight/40 animate-pulse"
                      : isShielded
                      ? "bg-primary/5 border-2 border-dashed border-primary/40"
                      : cell === "X"
                      ? "bg-x-color/5 border-2 border-x-color/20 glow-x"
                      : cell === "O"
                      ? "bg-o-color/5 border-2 border-o-color/20 glow-o"
                      : "bg-secondary/50 border-2 border-border/50 hover:bg-cell-hover hover:border-primary/40 cursor-pointer"
                    }
                    ${cell || winner || isDraw ? "cursor-default" : ""}
                  `}
                  disabled={!!cell || !!winner || isDraw}
                >
                  <AnimatePresence>
                    {cell === "X" && <XMark isWin={!!isWinCell} />}
                    {cell === "O" && <OMark isWin={!!isWinCell} />}
                  </AnimatePresence>
                  {isShielded && <span className="absolute top-0.5 right-1 text-[10px]">🛡️</span>}
                  {isPeek && !cell && <span className="text-[10px] text-win-highlight animate-pulse">💡</span>}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Power-ups */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button onClick={usePeek} disabled={gameOver} className="glass-card flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-40">
            <Eye className="h-3 w-3" /> Peek ({POWERUP_COSTS.peek}🪙)
          </button>
          <button onClick={useShield} disabled={gameOver} className="glass-card flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-40">
            <Shield className="h-3 w-3" /> Shield ({POWERUP_COSTS.shield}🪙)
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button onClick={undoMove} disabled={moveHistory.length === 0 || gameOver}
            className="glass-card flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-30">
            <Undo2 className="h-3.5 w-3.5" /> Undo (10🪙)
          </button>
          <button onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl active:scale-95">
            <RotateCcw className="h-4 w-4" /> Play Again
          </button>
          <button onClick={redoMove} disabled={redoStack.length === 0 || gameOver}
            className="glass-card flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-30">
            <Redo2 className="h-3.5 w-3.5" /> Redo (10🪙)
          </button>
        </div>

        <button onClick={resetAll} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          Reset Everything
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 border-l border-border/50 bg-card/30 backdrop-blur-sm p-4 overflow-y-auto max-h-screen">
        <Sidebar
          coinsX={coinsX} coinsO={coinsO} boardTheme={boardTheme} setBoardTheme={setBoardTheme}
          difficulty={difficulty} setDifficulty={(d) => { setDifficulty(d); reset(); }}
          soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
          onResetCoins={() => { resetCoinsStorage(); setCoinsX(0); setCoinsO(0); refreshSidebar(); toast("Coins reset"); }}
          vsAI={vsAI} refreshKey={refreshKey}
        />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-card border-l border-border z-40 p-4 overflow-y-auto lg:hidden"
          >
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
            <div className="mt-8">
              <Sidebar
                coinsX={coinsX} coinsO={coinsO} boardTheme={boardTheme} setBoardTheme={setBoardTheme}
                difficulty={difficulty} setDifficulty={(d) => { setDifficulty(d); reset(); }}
                soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
                onResetCoins={() => { resetCoinsStorage(); setCoinsX(0); setCoinsO(0); refreshSidebar(); toast("Coins reset"); }}
                vsAI={vsAI} refreshKey={refreshKey}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {sidebarOpen && <div className="fixed inset-0 bg-background/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
