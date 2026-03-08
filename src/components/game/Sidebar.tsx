import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Trophy, History, Coins, Award, ChevronDown, ChevronUp, Flame, Crown } from "lucide-react";
import {
  type BoardTheme, type Difficulty,
  ACHIEVEMENT_DEFS, AVATARS, BOARD_THEMES, POWERUP_COSTS,
} from "./types";
import {
  getGameStats, getAchievements, getGameHistory,
  getCoinHistory, getPlayerName, setPlayerName, getAvatar, setAvatarStorage,
} from "./storage";

interface SidebarProps {
  coinsX: number;
  coinsO: number;
  boardTheme: BoardTheme;
  setBoardTheme: (t: BoardTheme) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  vsAI: boolean;
  refreshKey: number;
}

export default function Sidebar({
  coinsX, coinsO, boardTheme, setBoardTheme, difficulty, setDifficulty,
  soundEnabled, setSoundEnabled, vsAI, refreshKey,
}: SidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    stats: true, achievements: true, history: false, coins: false, settings: false, names: false,
  });

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const stats = useMemo(() => getGameStats(), [refreshKey]);
  const achievements = useMemo(() => getAchievements(), [refreshKey]);
  const gameHistory = useMemo(() => getGameHistory(), [refreshKey]);
  const coinHistory = useMemo(() => getCoinHistory(), [refreshKey]);
  const totalGames = stats.games;
  const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  const [nameX, setNameX] = useState(() => getPlayerName("X"));
  const [nameO, setNameO] = useState(() => getPlayerName("O"));
  const [avatarX, setAvatarX] = useState(() => getAvatar("X"));
  const [avatarO, setAvatarO] = useState(() => getAvatar("O"));

  const unlockedCount = Object.keys(achievements).length;
  const totalAchievements = Object.keys(ACHIEVEMENT_DEFS).length;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Overall Stats */}
      <SidebarSection title="Statistics" emoji="📊" icon={<Trophy className="h-3.5 w-3.5 text-gold" />} open={openSections.stats} onToggle={() => toggle("stats")}>
        <div className="space-y-2">
          {/* Win rate visual bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-muted-foreground">Win Rate</span>
              <span className="font-bold text-gradient-gold">{winRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, hsl(140,60%,45%), hsl(165,80%,48%))` }}
                initial={{ width: 0 }} animate={{ width: `${winRate}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Games" value={totalGames} color="text-primary" />
            <StatCard label="Wins" value={stats.wins} color="text-accent" />
            <StatCard label="Best Time" value={stats.bestTime ? `${stats.bestTime}s` : "--"} color="text-primary" />
            <StatCard label="Streak" value={
              <span className="flex items-center gap-0.5">
                {stats.winStreak > 0 && <Flame className="h-3 w-3 text-streak" />}
                {stats.winStreak}/{stats.maxStreak || 0}
              </span>
            } color="text-streak" />
          </div>
        </div>
      </SidebarSection>

      {/* Player Names */}
      <SidebarSection title="Players" emoji="👤" icon={null} open={openSections.names} onToggle={() => toggle("names")}>
        <div className="space-y-2.5">
          <PlayerInput
            label="Player X" color="border-x-color/30" avatarValue={avatarX}
            onAvatarChange={(v) => { setAvatarX(v); setAvatarStorage("X", v); }}
            nameValue={nameX === "Player X" ? "" : nameX}
            onNameChange={(v) => { setNameX(v || "Player X"); setPlayerName("X", v || "Player X"); }}
            placeholder="Player X"
          />
          <PlayerInput
            label="Player O" color="border-o-color/30" avatarValue={avatarO}
            onAvatarChange={(v) => { setAvatarO(v); setAvatarStorage("O", v); }}
            nameValue={nameO === "Player O" ? "" : nameO}
            onNameChange={(v) => { setNameO(v || "Player O"); setPlayerName("O", v || "Player O"); }}
            placeholder="Player O"
          />
        </div>
      </SidebarSection>

      {/* Coins */}
      <SidebarSection title="Coins" emoji="🪙" icon={<Coins className="h-3.5 w-3.5 text-gold" />} open={openSections.coins} onToggle={() => toggle("coins")}
        badge={<span className="text-[9px] font-bold text-gold">{coinsX + coinsO}</span>}>
        <div className="space-y-2.5">
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg bg-x-color/5 border border-x-color/15 p-2 text-center">
              <span className="text-[9px] text-muted-foreground block">X</span>
              <span className="text-sm font-bold text-x-color" style={{ fontFamily: "'JetBrains Mono'" }}>{coinsX}</span>
            </div>
            <div className="flex-1 rounded-lg bg-o-color/5 border border-o-color/15 p-2 text-center">
              <span className="text-[9px] text-muted-foreground block">O</span>
              <span className="text-sm font-bold text-o-color" style={{ fontFamily: "'JetBrains Mono'" }}>{coinsO}</span>
            </div>
          </div>
          {coinHistory.length > 0 && (
            <div className="max-h-20 overflow-y-auto rounded-lg bg-secondary/30 p-2 space-y-0.5">
              {coinHistory.slice(-6).reverse().map((c, i) => (
                <div key={i} className="text-[9px] text-muted-foreground/70">
                  {new Date(c.t).toLocaleTimeString()} — {c.player} {c.amount > 0 ? "+" : ""}{c.amount}
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarSection>

      {/* Achievements */}
      <SidebarSection title="Achievements" emoji="🏆" icon={<Award className="h-3.5 w-3.5 text-gold" />} open={openSections.achievements} onToggle={() => toggle("achievements")}
        badge={<span className="text-[9px] font-bold text-accent">{unlockedCount}/{totalAchievements}</span>}>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ACHIEVEMENT_DEFS).map(([id, def]) => {
            const unlocked = !!achievements[id];
            return (
              <motion.div
                key={id}
                title={`${def.name}: ${def.desc}`}
                whileHover={{ scale: 1.15 }}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-lg border-2 transition-all cursor-help gap-0.5
                  ${unlocked
                    ? "border-gold/40 bg-gradient-to-b from-gold/10 to-gold/3 shadow-lg shadow-gold/10"
                    : "border-border/30 bg-secondary/20 opacity-35 grayscale"
                  }`}
              >
                <span className="text-xl">{def.emoji}</span>
                <span className="text-[7px] text-muted-foreground font-medium leading-tight text-center px-0.5">{def.name}</span>
              </motion.div>
            );
          })}
        </div>
      </SidebarSection>

      {/* Game History */}
      <SidebarSection title="History" emoji="📜" icon={<History className="h-3.5 w-3.5" />} open={openSections.history} onToggle={() => toggle("history")}
        badge={<span className="text-[9px] text-muted-foreground">{gameHistory.length}</span>}>
        {gameHistory.length === 0 ? (
          <p className="text-[10px] text-muted-foreground/50 text-center py-3">No games played yet</p>
        ) : (
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {[...gameHistory].reverse().map((entry, i) => {
              const emoji = entry.outcome === "win" ? "✅" : entry.outcome === "loss" ? "❌" : "🤝";
              const bg = entry.outcome === "win" ? "bg-accent/5 border-accent/20" : entry.outcome === "loss" ? "bg-destructive/5 border-destructive/20" : "bg-gold/5 border-gold/20";
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`text-[10px] rounded-lg p-2 border ${bg}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{emoji} {entry.outcome === "win" ? "Win" : entry.outcome === "loss" ? "Loss" : "Draw"}</span>
                    <span className="text-muted-foreground/60">{entry.time > 0 && `${entry.time}s`}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground/50 mt-0.5">
                    vs {entry.opponent} • {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </SidebarSection>

      {/* Settings */}
      <SidebarSection title="Settings" emoji="⚙️" icon={<Settings className="h-3.5 w-3.5" />} open={openSections.settings} onToggle={() => toggle("settings")}>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">Board Theme</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((t) => (
                <button key={t} onClick={() => setBoardTheme(t)}
                  className={`px-2.5 py-1.5 text-[10px] rounded-lg border font-semibold transition-all capitalize
                    ${t === boardTheme ? "bg-primary/15 text-primary border-primary/40 shadow-sm" : "bg-secondary/30 text-muted-foreground border-border/30 hover:border-primary/20"}`}>
                  {BOARD_THEMES[t].label}
                </button>
              ))}
            </div>
          </div>

          {vsAI && (
            <div>
              <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">AI Difficulty</label>
              <div className="flex gap-1.5">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`flex-1 px-2 py-1.5 text-[10px] rounded-lg border font-semibold transition-all capitalize
                      ${d === difficulty ? "bg-primary/15 text-primary border-primary/40" : "bg-secondary/30 text-muted-foreground border-border/30 hover:border-primary/20"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2.5 text-xs cursor-pointer group">
            <div className={`w-8 h-4.5 rounded-full transition-all relative ${soundEnabled ? "bg-primary" : "bg-secondary"}`}>
              <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="sr-only" />
              <motion.div className="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-primary-foreground shadow-sm"
                animate={{ left: soundEnabled ? 16 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Sound Effects</span>
          </label>
        </div>
      </SidebarSection>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

function SidebarSection({ title, emoji, icon, open, onToggle, children, badge }: {
  title: string; emoji: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode; badge?: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden group/section">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold text-foreground/90 hover:bg-secondary/20 transition-all duration-200">
        <span className="flex items-center gap-2.5">
          <span className="text-base drop-shadow-sm">{emoji}</span>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</span>
          {badge && <span className="ml-1">{badge}</span>}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
            <div className="px-3.5 pb-3.5 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="rounded-lg bg-secondary/20 border border-border/20 p-2 text-center">
      <span className="text-[8px] uppercase tracking-widest text-muted-foreground/60 block">{label}</span>
      <span className={`text-sm font-bold ${color}`} style={{ fontFamily: "'JetBrains Mono'" }}>{value}</span>
    </div>
  );
}

function PlayerInput({ label, color, avatarValue, onAvatarChange, nameValue, onNameChange, placeholder }: {
  label: string; color: string; avatarValue: string; onAvatarChange: (v: string) => void;
  nameValue: string; onNameChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className={`flex gap-2 items-center rounded-lg border ${color} bg-secondary/10 p-1.5`}>
      <select value={avatarValue} onChange={(e) => onAvatarChange(e.target.value)}
        className="bg-transparent text-foreground border-none rounded-md px-1 py-0.5 text-xs w-14 focus:outline-none cursor-pointer">
        {AVATARS.map((a) => <option key={a.value} value={a.value}>{a.value}</option>)}
      </select>
      <input value={nameValue} onChange={(e) => onNameChange(e.target.value)} placeholder={placeholder}
        className="flex-1 bg-transparent text-foreground border-none rounded-md px-1 py-0.5 text-xs placeholder:text-muted-foreground/40 focus:outline-none" />
    </div>
  );
}
