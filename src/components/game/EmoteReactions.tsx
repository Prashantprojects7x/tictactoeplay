import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const EMOTES = [
  { emoji: "😂", label: "Laugh" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👏", label: "Clap" },
  { emoji: "💀", label: "Dead" },
  { emoji: "🎉", label: "Party" },
  { emoji: "😎", label: "Cool" },
  { emoji: "😤", label: "Angry" },
  { emoji: "💪", label: "Strong" },
];

interface FloatingEmote {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

interface EmoteReactionsProps {
  onSendEmote: (emoji: string) => void;
  disabled?: boolean;
}

export function EmoteBar({ onSendEmote, disabled }: EmoteReactionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-card/80 border border-border/40 backdrop-blur-sm"
    >
      {EMOTES.map(({ emoji, label }) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.3, y: -4 }}
          whileTap={{ scale: 0.8 }}
          onClick={() => !disabled && onSendEmote(emoji)}
          disabled={disabled}
          className="text-xl p-1 rounded-lg hover:bg-secondary/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={label}
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

export function FloatingEmotes() {
  return null; // Managed externally
}

interface EmoteOverlayProps {
  emotes: FloatingEmote[];
}

export function EmoteOverlay({ emotes }: EmoteOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <AnimatePresence>
        {emotes.map((emote) => (
          <motion.div
            key={emote.id}
            initial={{
              opacity: 0,
              scale: 0.3,
              x: `${emote.x}%`,
              y: `${emote.y}%`,
              rotate: -15 + Math.random() * 30,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.3, 1.6, 1.8, 1.2],
              y: `${emote.y - 25}%`,
              rotate: [-10, 5, -3, 0],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: 2,
              ease: "easeOut",
              opacity: { times: [0, 0.15, 0.7, 1] },
              scale: { times: [0, 0.2, 0.5, 1] },
            }}
            className="absolute text-6xl md:text-7xl select-none drop-shadow-lg"
            style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.4))" }}
          >
            {emote.emoji}
            {/* Ripple ring */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border-2 border-primary/30"
              style={{ margin: "-50%", width: "200%", height: "200%" }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useEmoteSystem() {
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);

  const showEmote = useCallback((emoji: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const x = 25 + Math.random() * 50; // center-ish
    const y = 30 + Math.random() * 30;
    setFloatingEmotes((prev) => [...prev, { id, emoji, x, y }]);
    // Auto-remove after animation
    setTimeout(() => {
      setFloatingEmotes((prev) => prev.filter((e) => e.id !== id));
    }, 2500);
  }, []);

  return { floatingEmotes, showEmote };
}
