import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Trophy, History, Coins, Award, ChevronDown, ChevronUp } from "lucide-react";
import {
  type BoardTheme, type Difficulty,
  ACHIEVEMENT_DEFS, AVATARS, BOARD_THEMES, POWERUP_COSTS,
} from "./types";
import {
  getCoins, getGameStats, getAchievements, getGameHistory,
  getCoinHistory, getPlayerName, setPlayerName, getAvatar, setAvatarStorage,
  resetCoinsStorage, checkDailyLogin,
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
  onResetCoins: () => void;
  vsAI: boolean;
  refreshKey: number;
}

export default function Sidebar({
  coinsX, coinsO, boardTheme, setBoardTheme, difficulty, setDifficulty,
  soundEnabled, setSoundEnabled, onResetCoins, vsAI, refreshKey,
}: SidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    stats: true, achievements: false, history: false, coins: false, settings: false, names: false,
  });

  const toggle = (key: string) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const stats = useMemo(() => getGameStats(), [refreshKey]);
  const achievements = useMemo(() => getAchievements(), [refreshKey]);
  const gameHistory = useMemo(() => getGameHistory(), [refreshKey]);
  const coinHistory = useMemo(() => getCoinHistory(), [refreshKey]);
  const totalGames = stats.games;
  const winRate = totalGames > 0 ? Math.round((stats.wins / totalGames) * 100) : 0;

  // Player names
  const [nameX, setNameX] = useState(() => getPlayerName("X"));
  const [nameO, setNameO] = useState(() => getPlayerName("O"));
  const [avatarX, setAvatarX] = useState(() => getAvatar("X"));
  const [avatarO, setAvatarO] = useState(() => getAvatar("O"));

  return (
    <div className="flex flex-col gap-2 w-full max-w-xs">
      {/* Overall Stats */}
      <SidebarSection title="📊 Statistics" icon={<Trophy className="h-3.5 w-3.5" />} open={openSections.stats} onToggle={() => toggle("stats")}>
        <div className="space-y-1.5 text-xs">
          <StatRow label="Total Games" value={<span className="text-primary font-bold">{totalGames}</span>} />
          <StatRow label="Total Wins" value={<span className="font-bold" style={{ color: "hsl(140,60%,50%)" }}>{stats.wins}</span>} />
          <StatRow label="Win Rate" value={<span className="font-bold" style={{ color: "hsl(35,90%,55%)" }}>{winRate}%</span>} />
          <StatRow label="Best Time" value={<span className="font-bold text-primary">{stats.bestTime ? `${stats.bestTime}s` : "--"}</span>} />
          <StatRow label="Win Streak" value={
            <span className="font-bold" style={{ color: "hsl(0,70%,55%)" }}>
              {stats.winStreak > 0 && "🔥 "}{stats.winStreak}/{stats.maxStreak || 0}
            </span>
          } />
          <StatRow label="Total Coins" value={<span className="font-bold" style={{ color: "hsl(35,90%,55%)" }}>🪙 {coinsX + coinsO}</span>} />
        </div>
      </SidebarSection>

      {/* Player Names */}
      <SidebarSection title="👤 Players" icon={null} open={openSections.names} onToggle={() => toggle("names")}>
        <div className="space-y-2">
          <div className="flex gap-1.5 items-center">
            <select
              value={avatarX}
              onChange={(e) => { setAvatarX(e.target.value); setAvatarStorage("X", e.target.value); }}
              className="bg-secondary text-secondary-foreground border border-border rounded-md px-1 py-1 text-xs"
            >
              {AVATARS.map((a) => <option key={a.value} value={a.value}>{a.value} {a.label}</option>)}
            </select>
            <input
              value={nameX === "Player X" ? "" : nameX}
              onChange={(e) => { setNameX(e.target.value || "Player X"); setPlayerName("X", e.target.value || "Player X"); }}
              placeholder="Player X"
              className="flex-1 bg-secondary text-secondary-foreground border border-border rounded-md px-2 py-1 text-xs placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-1.5 items-center">
            <select
              value={avatarO}
              onChange={(e) => { setAvatarO(e.target.value); setAvatarStorage("O", e.target.value); }}
              className="bg-secondary text-secondary-foreground border border-border rounded-md px-1 py-1 text-xs"
            >
              {AVATARS.map((a) => <option key={a.value} value={a.value}>{a.value} {a.label}</option>)}
            </select>
            <input
              value={nameO === "Player O" ? "" : nameO}
              onChange={(e) => { setNameO(e.target.value || "Player O"); setPlayerName("O", e.target.value || "Player O"); }}
              placeholder="Player O"
              className="flex-1 bg-secondary text-secondary-foreground border border-border rounded-md px-2 py-1 text-xs placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </SidebarSection>

      {/* Coins */}
      <SidebarSection title="🪙 Coins" icon={<Coins className="h-3.5 w-3.5" />} open={openSections.coins} onToggle={() => toggle("coins")}>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>X coins: <span className="font-bold text-x-color">{coinsX}</span></span>
            <span>O coins: <span className="font-bold text-o-color">{coinsO}</span></span>
          </div>
          <button
            onClick={onResetCoins}
            className="w-full text-[10px] py-1 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
          >
            Reset Coins
          </button>
          {coinHistory.length > 0 && (
            <div className="max-h-20 overflow-y-auto rounded-md bg-secondary/50 p-2 space-y-0.5">
              {coinHistory.slice(-6).reverse().map((c, i) => (
                <div key={i} className="text-[10px] text-muted-foreground">
                  {new Date(c.t).toLocaleTimeString()} — {c.player} {c.amount > 0 ? "earned" : "spent"} {Math.abs(c.amount)}
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarSection>

      {/* Achievements */}
      <SidebarSection title="🏆 Achievements" icon={<Award className="h-3.5 w-3.5" />} open={openSections.achievements} onToggle={() => toggle("achievements")}>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ACHIEVEMENT_DEFS).map(([id, def]) => {
            const unlocked = !!achievements[id];
            return (
              <div
                key={id}
                title={`${def.name}: ${def.desc}`}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all cursor-help
                  ${unlocked
                    ? "border-win-highlight bg-gradient-to-br from-win-highlight/20 to-win-highlight/5 shadow-md"
                    : "border-border bg-secondary/50 opacity-40"
                  }`}
              >
                {def.emoji}
              </div>
            );
          })}
        </div>
      </SidebarSection>

      {/* Game History */}
      <SidebarSection title="📜 Game History" icon={<History className="h-3.5 w-3.5" />} open={openSections.history} onToggle={() => toggle("history")}>
        {gameHistory.length === 0 ? (
          <p className="text-[10px] text-muted-foreground text-center py-2">No games played yet</p>
        ) : (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {[...gameHistory].reverse().map((entry, i) => {
              const emoji = entry.outcome === "win" ? "✅" : entry.outcome === "loss" ? "❌" : "🤝";
              const borderColor = entry.outcome === "win" ? "border-l-green-500" : entry.outcome === "loss" ? "border-l-red-500" : "border-l-yellow-500";
              return (
                <div key={i} className={`text-[10px] rounded bg-secondary/50 p-1.5 border-l-2 ${borderColor}`}>
                  <span>{emoji} {entry.outcome === "win" ? "Win" : entry.outcome === "loss" ? "Loss" : "Draw"}</span>
                  <span className="text-muted-foreground"> vs {entry.opponent}</span>
                  <span className="text-muted-foreground block">
                    {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {entry.time > 0 && ` • ${entry.time}s`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </SidebarSection>

      {/* Settings */}
      <SidebarSection title="⚙️ Settings" icon={<Settings className="h-3.5 w-3.5" />} open={openSections.settings} onToggle={() => toggle("settings")}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Board Theme</label>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(BOARD_THEMES) as BoardTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setBoardTheme(t)}
                  className={`px-2 py-1 text-[10px] rounded-md border transition-all capitalize
                    ${t === boardTheme ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"}`}
                >
                  {BOARD_THEMES[t].label}
                </button>
              ))}
            </div>
          </div>

          {vsAI && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">AI Difficulty</label>
              <div className="flex gap-1">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-2 py-1 text-[10px] rounded-md border transition-all capitalize
                      ${d === difficulty ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} className="accent-primary" />
            <span className="text-muted-foreground">Sound Effects</span>
          </label>
        </div>
      </SidebarSection>
    </div>
  );
}

function SidebarSection({ title, icon, open, onToggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary/30 transition-colors">
        <span className="flex items-center gap-1.5">{icon} {title}</span>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      {value}
    </div>
  );
}
