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

// Shared AudioContext for performance
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === "closed") _audioCtx = new AudioContext();
  if (_audioCtx.state === "suspended") _audioCtx.resume();
  return _audioCtx;
}

function createNote(ctx: AudioContext, freq: number, type: OscillatorType, vol: number, start: number, end: number, dest?: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(dest || ctx.destination);
  gain.gain.setValueAtTime(vol, start);
  gain.gain.exponentialRampToValueAtTime(0.001, end);
  osc.start(start);
  osc.stop(end + 0.05);
}

export type SoundType = "place" | "win" | "loss" | "draw" | "coin" | "achievement" | "click" | "hover" | "powerup" | "error";

export function playSound(type: SoundType, volume: number = 0.1) {
  try {
    const ctx = getAudioCtx();
    const t = ctx.currentTime;

    switch (type) {
      case "place": {
        // Crisp pop with harmonics
        createNote(ctx, 520 + Math.random() * 80, "sine", volume, t, t + 0.06);
        createNote(ctx, 1040 + Math.random() * 80, "sine", volume * 0.3, t, t + 0.04);
        break;
      }
      case "win": {
        // Triumphant arpeggio: C5 → E5 → G5 → C6
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          createNote(ctx, freq, "sine", volume * 0.8, t + i * 0.1, t + i * 0.1 + 0.25);
          createNote(ctx, freq * 2, "sine", volume * 0.15, t + i * 0.1, t + i * 0.1 + 0.15);
        });
        break;
      }
      case "loss": {
        // Descending minor: G4 → Eb4 → C4
        const notes = [392, 311, 262];
        notes.forEach((freq, i) => {
          createNote(ctx, freq, "triangle", volume * 0.6, t + i * 0.15, t + i * 0.15 + 0.3);
        });
        break;
      }
      case "draw": {
        // Neutral two-tone
        createNote(ctx, 440, "triangle", volume * 0.5, t, t + 0.15);
        createNote(ctx, 370, "triangle", volume * 0.5, t + 0.12, t + 0.3);
        break;
      }
      case "coin": {
        // Bright sparkle
        createNote(ctx, 1200, "sine", volume * 0.6, t, t + 0.08);
        createNote(ctx, 1600, "sine", volume * 0.5, t + 0.05, t + 0.15);
        createNote(ctx, 2000, "sine", volume * 0.3, t + 0.08, t + 0.2);
        break;
      }
      case "achievement": {
        // Fanfare: two rising chords
        createNote(ctx, 523, "sine", volume * 0.7, t, t + 0.2);
        createNote(ctx, 659, "sine", volume * 0.7, t, t + 0.2);
        createNote(ctx, 784, "sine", volume * 0.7, t + 0.15, t + 0.4);
        createNote(ctx, 1047, "sine", volume * 0.7, t + 0.15, t + 0.4);
        createNote(ctx, 1319, "sine", volume * 0.4, t + 0.3, t + 0.55);
        break;
      }
      case "click": {
        // Subtle tick
        createNote(ctx, 800, "square", volume * 0.15, t, t + 0.025);
        break;
      }
      case "hover": {
        // Ultra-soft blip
        createNote(ctx, 600, "sine", volume * 0.08, t, t + 0.02);
        break;
      }
      case "powerup": {
        // Whoosh up
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(volume * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.3);
        break;
      }
      case "error": {
        // Buzz
        createNote(ctx, 150, "sawtooth", volume * 0.3, t, t + 0.12);
        createNote(ctx, 140, "sawtooth", volume * 0.2, t + 0.06, t + 0.15);
        break;
      }
    }
  } catch { /* silence */ }
}
