import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Volume2, VolumeX, Music, Music2, X as XIcon } from "lucide-react";
import { useState } from "react";

interface SettingsMenuProps {
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (v: number) => void;
  musicEnabled: boolean;
  setMusicEnabled: (v: boolean) => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
}

export default function SettingsMenu({
  soundEnabled, setSoundEnabled,
  sfxVolume, setSfxVolume,
  musicEnabled, setMusicEnabled,
  musicVolume, setMusicVolume,
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="nav-item-glow relative rounded-xl p-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
        title="Settings"
      >
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ type: "spring", stiffness: 200 }}>
          <Settings className="h-4 w-4" />
        </motion.div>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
              />

              {/* Panel */}
              <motion.div
                className="fixed top-1/2 left-1/2 z-[101] w-[320px] max-w-[90vw] -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="glass-card rounded-2xl border border-border/30 p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-bold tracking-tight text-foreground">Audio Settings</h3>
                    </div>
                    <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-secondary/50 transition-colors">
                      <XIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="h-px bg-border/20" />

                  {/* Background Music */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music2 className="h-3.5 w-3.5 text-accent" />
                        <span className="text-xs font-semibold text-foreground">Background Music</span>
                      </div>
                      <button
                        onClick={() => setMusicEnabled(!musicEnabled)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${musicEnabled ? "bg-accent" : "bg-secondary"}`}
                      >
                        <motion.div
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-foreground shadow-md"
                          animate={{ left: musicEnabled ? 18 : 2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Music className="h-3 w-3 text-muted-foreground shrink-0" />
                      <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                        disabled={!musicEnabled}
                        className="volume-slider flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
                        {Math.round(musicVolume * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-border/20" />

                  {/* Sound Effects */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Sound Effects</span>
                      </div>
                      <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${soundEnabled ? "bg-primary" : "bg-secondary"}`}
                      >
                        <motion.div
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-foreground shadow-md"
                          animate={{ left: soundEnabled ? 18 : 2 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      {soundEnabled ? (
                        <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : (
                        <VolumeX className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      <input
                        type="range"
                        min="0" max="1" step="0.01"
                        value={sfxVolume}
                        onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                        disabled={!soundEnabled}
                        className="volume-slider flex-1"
                      />
                      <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">
                        {Math.round(sfxVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
