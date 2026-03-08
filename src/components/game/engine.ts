import { Player, WINNING_LINES, Difficulty } from "./types";

export function checkWinner(board: Player[]): { winner: Player; line: number[] | null } {
  for (const combo of WINNING_LINES) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: combo };
    }
  }
  return { winner: null, line: null };
}

export function getAIMove(board: Player[], difficulty: Difficulty): number {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

  if (difficulty === "easy") {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  if (difficulty === "medium") {
    if (Math.random() < 0.35) return empty[Math.floor(Math.random() * empty.length)];
  }

  // Hard: minimax; Medium fallback: heuristic
  if (difficulty === "hard") {
    return minimax(board, 0, true).index!;
  }

  // win > block > center > corner > edge
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

function minimax(board: Player[], depth: number, isMax: boolean): { score: number; index?: number } {
  const { winner } = checkWinner(board);
  if (winner === "O") return { score: 10 - depth };
  if (winner === "X") return { score: depth - 10 };
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
  if (empty.length === 0) return { score: 0 };

  let best = isMax ? { score: -Infinity, index: empty[0] } : { score: Infinity, index: empty[0] };

  for (const i of empty) {
    const next = [...board];
    next[i] = isMax ? "O" : "X";
    const result = minimax(next, depth + 1, !isMax);
    if (isMax ? result.score > best.score : result.score < best.score) {
      best = { score: result.score, index: i };
    }
  }
  return best;
}

/** Find best move for current player to show as "peek" hint */
export function findBestMoveForPlayer(board: Player[], player: "X" | "O"): number | null {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
  if (empty.length === 0) return null;
  
  // Check if player can win
  for (const i of empty) {
    const test = [...board]; test[i] = player;
    if (checkWinner(test).winner === player) return i;
  }
  // Block opponent
  const opp = player === "X" ? "O" : "X";
  for (const i of empty) {
    const test = [...board]; test[i] = opp;
    if (checkWinner(test).winner === opp) return i;
  }
  if (empty.includes(4)) return 4;
  const corners = [0, 2, 6, 8].filter((i) => empty.includes(i));
  if (corners.length) return corners[0];
  return empty[0];
}

export function playSound(type: "place" | "win" | "draw" | "coin" | "achievement", volume: number = 0.1) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = volume;

    switch (type) {
      case "place":
        osc.frequency.value = 440 + Math.random() * 200;
        osc.start(); osc.stop(ctx.currentTime + 0.08);
        break;
      case "win": {
        osc.frequency.value = 587;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.connect(g2); g2.connect(ctx.destination);
        osc2.frequency.value = 880; g2.gain.value = volume;
        osc2.start(ctx.currentTime + 0.15); osc2.stop(ctx.currentTime + 0.5);
        break;
      }
      case "draw":
        osc.frequency.value = 300;
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        break;
      case "coin":
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
        break;
      case "achievement":
        osc.frequency.value = 660;
        osc.start(); osc.stop(ctx.currentTime + 0.15);
        const o2 = ctx.createOscillator();
        const g2b = ctx.createGain();
        o2.connect(g2b); g2b.connect(ctx.destination);
        o2.frequency.value = 990; g2b.gain.value = volume;
        o2.start(ctx.currentTime + 0.1); o2.stop(ctx.currentTime + 0.3);
        break;
    }
  } catch { /* silence */ }
}
