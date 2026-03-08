import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Monitor, Users, Trophy, Minus, Zap, Brain, Sparkles, Volume2, VolumeX, History, ChevronDown, ChevronUp } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

type Player = "X" | "O" | null;
type Difficulty = "easy" | "medium" | "hard";
type MoveRecord = { index: number; player: "X" | "O"; moveNumber: number };

// ─── Win detection ────────────────────────────────────────────────
function checkWinner(board: Player[]): { winner: Player; line: number[] | null } {
  for (const combo of WINNING_LINES) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

// ─── AI with difficulty levels ────────────────────────────────────
function getAIMove(board: Player[], difficulty: Difficulty): number {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

  if (difficulty === "easy") {
    // 70% random, 30% smart
    if (Math.random() < 0.7) return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "medium") {
    // 40% random
    if (Math.random() < 0.4) return empty[Math.floor(Math.random() * empty.length)];
  }

  // Smart moves: win > block > center > corner > edge
  for (const i of empty) {
    const test = [...board]; test[i] = "O";
    if (checkWinner(test).winner === "O") return i;
  }
  for (const i of empty) {
    const test = [...board]; test[i] = "X";
    if (checkWinner(test).winner === "X") return i;
  }
  if (empty.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

// ─── Confetti particles ──────────────────────────────────────────
function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
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

// ─── X/O SVG marks ────────────────────────────────────────────────
function XMark({ isWin }: { isWin: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 50 50"
      className={`h-12 w-12 sm:h-14 sm:w-14 ${isWin ? "drop-shadow-[0_0_8px_hsl(45,95%,55%)]" : ""}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}
    >
      <motion.line
        x1="10" y1="10" x2="40" y2="40"
        stroke={isWin ? "hsl(45,95%,55%)" : "hsl(260,85%,70%)"}
        strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1="40" y1="10" x2="10" y2="40"
        stroke={isWin ? "hsl(45,95%,55%)" : "hsl(260,85%,70%)"}
        strokeWidth="4" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
    </motion.svg>
  );
}

function OMark({ isWin }: { isWin: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 50 50"
      className={`h-12 w-12 sm:h-14 sm:w-14 ${isWin ? "drop-shadow-[0_0_8px_hsl(45,95%,55%)]" : ""}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 15 }}
    >
      <motion.circle
        cx="25" cy="25" r="15"
        stroke={isWin ? "hsl(45,95%,55%)" : "hsl(170,75%,50%)"}
        strokeWidth="4" fill="none" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
    </motion.svg>
  );
}

// ─── Main component ──────────────────────────────────────────────
export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [vsAI, setVsAI] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gameOver, setGameOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [round, setRound] = useState(1);
  const moveCountRef = useRef(0);

  const { winner } = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const status = winner
    ? `Player ${winner} Wins!`
    : isDraw
    ? "It's a Draw!"
    : `Player ${isXTurn ? "X" : "O"}'s Turn`;

  // Play simple click sound via Web Audio API
  const playSound = useCallback((type: "place" | "win" | "draw") => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "place") {
        osc.frequency.value = 440 + Math.random() * 200;
        gain.gain.value = 0.08;
        osc.start(); osc.stop(ctx.currentTime + 0.08);
      } else if (type === "win") {
        osc.frequency.value = 587;
        gain.gain.value = 0.1;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.frequency.value = 880;
        g2.gain.value = 0.1;
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.5);
      } else {
        osc.frequency.value = 300;
        gain.gain.value = 0.06;
        osc.start(); osc.stop(ctx.currentTime + 0.2);
      }
    } catch { /* fallback silence */ }
  }, [soundEnabled]);

  // End-of-game effects
  useEffect(() => {
    if (gameOver) return;
    if (winner) {
      setScore((s) => ({ ...s, [winner]: s[winner as "X" | "O"] + 1 }));
      setWinLine(checkWinner(board).line);
      setGameOver(true);
      setShowConfetti(true);
      playSound("win");
      setTimeout(() => setShowConfetti(false), 3500);
    } else if (isDraw) {
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
      playSound("draw");
    }
  }, [board, winner, isDraw, gameOver, playSound]);

  // AI move
  useEffect(() => {
    if (vsAI && !isXTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => {
        const move = getAIMove(board, difficulty);
        if (move !== undefined) handleClick(move, true);
      }, 500);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isXTurn, vsAI, board, winner, isDraw, difficulty]);

  const handleClick = useCallback(
    (i: number, aiMove = false) => {
      if (board[i] || winner || isDraw) return;
      if (vsAI && !isXTurn && !aiMove) return;
      const player = isXTurn ? "X" : "O" as const;
      const next = [...board];
      next[i] = player;
      moveCountRef.current += 1;
      setBoard(next);
      setIsXTurn(!isXTurn);
      setMoveHistory((h) => [...h, { index: i, player, moveNumber: moveCountRef.current }]);
      playSound("place");
    },
    [board, isXTurn, winner, isDraw, vsAI, playSound]
  );

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinLine(null);
    setGameOver(false);
    setMoveHistory([]);
    setShowConfetti(false);
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
    reset();
    setScore({ X: 0, O: 0, draws: 0 });
    setRound(1);
  };

  const totalGames = score.X + score.O + score.draws;
  const winRateX = totalGames > 0 ? Math.round((score.X / totalGames) * 100) : 0;
  const winRateO = totalGames > 0 ? Math.round((score.O / totalGames) * 100) : 0;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 bg-background bg-grid-pattern p-4 overflow-hidden">
      {/* Background glow orbs */}
      <div className="pointer-events-none absolute top-1/4 -left-32 h-64 w-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-1/4 -right-32 h-64 w-64 rounded-full bg-accent/10 blur-[100px]" />

      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      {/* Header */}
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-4xl font-bold tracking-tighter text-foreground sm:text-5xl"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="text-gradient-x">Tic</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-gradient-o">Tac</span>
          <span className="text-muted-foreground">-</span>
          <span className="text-foreground">Toe</span>
        </h1>
        <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">Round {round}</p>
      </motion.div>

      {/* Controls row */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-2"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* Mode toggle */}
        <button
          onClick={toggleMode}
          className="glass-card flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-card-foreground transition-all hover:border-primary/50 active:scale-95"
        >
          {vsAI ? <Monitor className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-accent" />}
          {vsAI ? "vs AI" : "vs Human"}
        </button>

        {/* Difficulty (only in AI mode) */}
        <AnimatePresence>
          {vsAI && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex overflow-hidden"
            >
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); reset(); }}
                  className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all first:rounded-l-full last:rounded-r-full border border-border
                    ${d === difficulty
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                >
                  {d === "easy" ? <Zap className="h-3 w-3 inline mr-1" /> : d === "medium" ? <Brain className="h-3 w-3 inline mr-1" /> : <Sparkles className="h-3 w-3 inline mr-1" />}
                  {d}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="glass-card rounded-full p-2 text-muted-foreground transition-all hover:text-foreground hover:border-primary/50 active:scale-95"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </motion.div>

      {/* Scoreboard */}
      <motion.div
        className="glass-card flex items-stretch gap-0 rounded-2xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
      >
        <div className="flex flex-col items-center px-5 py-3 border-r border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-x-color" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player X</span>
          </div>
          <motion.span
            key={`x-${score.X}`}
            className="text-2xl font-bold text-gradient-x"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
          >
            {score.X}
          </motion.span>
          <span className="text-[10px] text-muted-foreground">{winRateX}% win</span>
        </div>
        <div className="flex flex-col items-center px-5 py-3 border-r border-border/50">
          <div className="flex items-center gap-1.5">
            <Minus className="h-2 w-2 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Draws</span>
          </div>
          <motion.span
            key={`d-${score.draws}`}
            className="text-2xl font-bold text-muted-foreground"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
          >
            {score.draws}
          </motion.span>
          <span className="text-[10px] text-muted-foreground">{totalGames} total</span>
        </div>
        <div className="flex flex-col items-center px-5 py-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-o-color" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Player O</span>
          </div>
          <motion.span
            key={`o-${score.O}`}
            className="text-2xl font-bold text-gradient-o"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
          >
            {score.O}
          </motion.span>
          <span className="text-[10px] text-muted-foreground">{winRateO}% win</span>
        </div>
      </motion.div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold
            ${winner ? "glass-card glow-win text-win-highlight" : isDraw ? "glass-card text-muted-foreground" : "text-foreground"}`}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {winner && <Trophy className="h-4 w-4" />}
          {status}
          {winner && <span className="text-lg">🎉</span>}
        </motion.div>
      </AnimatePresence>

      {/* Board */}
      <motion.div
        className="glass-card rounded-3xl p-3 sm:p-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {board.map((cell, i) => {
            const isWinCell = winLine?.includes(i);
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (
              <motion.button
                key={i}
                onClick={() => handleClick(i)}
                whileHover={!cell && !winner && !isDraw ? { scale: 1.05 } : {}}
                whileTap={!cell && !winner && !isDraw ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: row * 0.05 + col * 0.05 }}
                className={`relative flex h-24 w-24 items-center justify-center rounded-2xl transition-all duration-300 sm:h-28 sm:w-28
                  ${isWinCell
                    ? "bg-win-highlight/15 glow-win border-2 border-win-highlight/50"
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
                {/* Move number indicator */}
                {cell && (
                  <span className="absolute bottom-1 right-2 text-[9px] text-muted-foreground/50 font-mono">
                    {moveHistory.find((m) => m.index === i)?.moveNumber}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          Play Again
        </button>
        <button
          onClick={resetAll}
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground hover:border-primary/40 active:scale-95"
        >
          Reset All
        </button>
      </motion.div>

      {/* Move history toggle */}
      {moveHistory.length > 0 && (
        <motion.div
          className="w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-3 w-3" />
            Move History ({moveHistory.length})
            {showHistory ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 glass-card rounded-xl p-3 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {moveHistory.map((m) => (
                      <span
                        key={m.moveNumber}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-mono font-medium border
                          ${m.player === "X"
                            ? "border-x-color/30 text-x-color bg-x-color/5"
                            : "border-o-color/30 text-o-color bg-o-color/5"
                          }`}
                      >
                        #{m.moveNumber} {m.player} → R{Math.floor(m.index / 3) + 1}C{(m.index % 3) + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
