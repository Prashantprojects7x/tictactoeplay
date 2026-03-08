import { useState, useCallback, useEffect } from "react";
import { RotateCcw, Monitor, Users } from "lucide-react";

// All possible winning line indices
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diags
];

type Player = "X" | "O" | null;

/** Check for a winner; returns the winning player and line indices */
function checkWinner(board: Player[]): { winner: Player; line: number[] | null } {
  for (const combo of WINNING_LINES) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

/** Basic AI: win > block > center > corner > random */
function getAIMove(board: Player[]): number {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

  // Try to win
  for (const i of empty) {
    const test = [...board];
    test[i] = "O";
    if (checkWinner(test).winner === "O") return i;
  }
  // Block opponent
  for (const i of empty) {
    const test = [...board];
    test[i] = "X";
    if (checkWinner(test).winner === "X") return i;
  }
  // Center, corners, then any
  if (empty.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXTurn, setIsXTurn] = useState(true);
  const [winLine, setWinLine] = useState<number[] | null>(null);
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const [vsAI, setVsAI] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const { winner } = checkWinner(board);
  const isDraw = !winner && board.every(Boolean);

  // Status message
  const status = winner
    ? `Player ${winner} Wins! 🎉`
    : isDraw
    ? "It's a Draw!"
    : `Player ${isXTurn ? "X" : "O"}'s Turn`;

  // Handle end-of-game scoring
  useEffect(() => {
    if (gameOver) return;
    if (winner) {
      setScore((s) => ({ ...s, [winner]: s[winner as "X" | "O"] + 1 }));
      setWinLine(checkWinner(board).line);
      setGameOver(true);
    } else if (isDraw) {
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
    }
  }, [board, winner, isDraw, gameOver]);

  // AI move
  useEffect(() => {
    if (vsAI && !isXTurn && !winner && !isDraw) {
      const timeout = setTimeout(() => {
        const move = getAIMove(board);
        if (move !== undefined) handleClick(move, true);
      }, 400);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isXTurn, vsAI, board, winner, isDraw]);

  const handleClick = useCallback(
    (i: number, aiMove = false) => {
      if (board[i] || winner || isDraw) return;
      if (vsAI && !isXTurn && !aiMove) return; // block human during AI turn
      const next = [...board];
      next[i] = isXTurn ? "X" : "O";
      setBoard(next);
      setIsXTurn(!isXTurn);
    },
    [board, isXTurn, winner, isDraw, vsAI]
  );

  const reset = () => {
    setBoard(Array(9).fill(null));
    setIsXTurn(true);
    setWinLine(null);
    setGameOver(false);
  };

  const toggleMode = () => {
    setVsAI(!vsAI);
    reset();
    setScore({ X: 0, O: 0, draws: 0 });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-4">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Tic-Tac-Toe
      </h1>

      {/* Mode toggle */}
      <button
        onClick={toggleMode}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-card-foreground shadow-sm transition-all hover:shadow-md"
      >
        {vsAI ? <Monitor className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-accent" />}
        {vsAI ? "vs Computer" : "vs Human"}
        <span className="text-muted-foreground">· tap to switch</span>
      </button>

      {/* Scoreboard */}
      <div className="flex gap-3 text-sm font-semibold">
        <div className="rounded-lg bg-card px-4 py-2 shadow-sm border border-border">
          <span className="text-x-color">X</span>: {score.X}
        </div>
        <div className="rounded-lg bg-card px-4 py-2 shadow-sm border border-border">
          Draws: {score.draws}
        </div>
        <div className="rounded-lg bg-card px-4 py-2 shadow-sm border border-border">
          <span className="text-o-color">O</span>: {score.O}
        </div>
      </div>

      {/* Status */}
      <p className={`text-lg font-semibold transition-colors ${winner ? "text-primary" : isDraw ? "text-muted-foreground" : "text-foreground"}`}>
        {status}
      </p>

      {/* Board */}
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => {
          const isWinCell = winLine?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`flex h-24 w-24 items-center justify-center rounded-xl border-2 text-4xl font-bold transition-all duration-200 sm:h-28 sm:w-28 sm:text-5xl
                ${isWinCell ? "border-win-highlight bg-win-highlight/20 scale-105" : "border-border bg-card shadow-sm"}
                ${!cell && !winner && !isDraw ? "cursor-pointer hover:bg-cell-hover hover:border-primary/40 hover:scale-[1.03]" : ""}
                ${cell || winner || isDraw ? "cursor-default" : ""}
              `}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
              disabled={!!cell || !!winner || isDraw}
            >
              {cell && (
                <span className={`${cell === "X" ? "text-x-color" : "text-o-color"} animate-[pop_0.2s_ease-out]`}>
                  {cell}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
      >
        <RotateCcw className="h-4 w-4" />
        Play Again
      </button>
    </div>
  );
}
