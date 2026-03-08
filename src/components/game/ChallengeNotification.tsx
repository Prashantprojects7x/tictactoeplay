import { motion } from "framer-motion";
import { Swords, X as XIcon, Check } from "lucide-react";

interface Props {
  challengerName: string;
  challengerAvatar: string;
  onAccept: () => void;
  onDecline: () => void;
}

export default function ChallengeNotification({ challengerName, challengerAvatar, onAccept, onDecline }: Props) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -100, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm"
    >
      <div className="bg-card/95 backdrop-blur-xl border border-accent/40 rounded-2xl p-4 shadow-2xl shadow-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-2xl flex-shrink-0">
            {challengerAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Swords className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Challenge!</span>
            </div>
            <p className="text-sm font-semibold truncate">{challengerName}</p>
            <p className="text-[10px] text-muted-foreground">wants to play a match</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={onAccept}
              className="flex items-center gap-1 bg-accent text-accent-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:brightness-110 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" /> Play
            </button>
            <button
              onClick={onDecline}
              className="p-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
