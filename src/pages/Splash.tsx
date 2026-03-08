import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import gameLogo from "@/assets/game-logo-optimized.webp";

export default function Splash() {
  const [phase, setPhase] = useState<"logo" | "burst" | "done">("logo");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Phase 1: Show logo for 2s, then burst animation
    const t1 = setTimeout(() => setPhase("burst"), 2200);
    // Phase 2: After burst, navigate
    const t2 = setTimeout(() => setPhase("done"), 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase === "done" && !loading) {
      navigate(user ? "/" : "/auth", { replace: true });
    }
  }, [phase, loading, user, navigate]);

  // Particle ring for burst effect
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * Math.PI * 2;
    return {
      id: i,
      x: Math.cos(angle) * 220,
      y: Math.sin(angle) * 220,
      color: i % 3 === 0
        ? "hsl(265, 90%, 65%)"
        : i % 3 === 1
        ? "hsl(165, 80%, 50%)"
        : "hsl(330, 85%, 60%)",
      size: 4 + Math.random() * 6,
      delay: i * 0.02,
    };
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, hsl(260, 30%, 14%) 0%, hsl(235, 25%, 7%) 70%)",
      }}
    >
      {/* Ambient glow orbs */}
      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full blur-[180px]"
        style={{ background: "hsl(265, 90%, 50%)", opacity: 0.12 }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-[400px] w-[400px] rounded-full blur-[150px]"
        style={{ background: "hsl(165, 80%, 45%)", opacity: 0.08 }}
        animate={{ scale: [1.1, 0.9, 1.1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Floating sparkles */}
      {Array.from({ length: 40 }, (_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute rounded-full"
          style={{
            width: 1.5 + Math.random() * 3,
            height: 1.5 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 2 === 0 ? "hsl(265, 90%, 75%)" : "hsl(165, 80%, 60%)",
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Logo container */}
      <div className="relative flex flex-col items-center">
        {/* Burst particles */}
        <AnimatePresence>
          {phase === "burst" && particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                background: p.color,
                boxShadow: `0 0 12px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
              transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>

        {/* Pulsing ring behind logo */}
        <motion.div
          className="absolute rounded-[2.5rem]"
          style={{
            width: 200,
            height: 200,
            border: "2px solid hsl(265, 90%, 60%)",
            boxShadow: "0 0 40px hsl(265, 90%, 60% / 0.3), inset 0 0 40px hsl(265, 90%, 60% / 0.1)",
          }}
          animate={phase === "logo" ? {
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.7, 0.3],
          } : { scale: 2, opacity: 0 }}
          transition={phase === "logo"
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.6, ease: "easeOut" }
          }
        />

        {/* Second ring */}
        <motion.div
          className="absolute rounded-[2.5rem]"
          style={{
            width: 200,
            height: 200,
            border: "1px solid hsl(165, 80%, 50%)",
            boxShadow: "0 0 30px hsl(165, 80%, 50% / 0.2)",
          }}
          animate={phase === "logo" ? {
            scale: [1.1, 1.25, 1.1],
            opacity: [0.2, 0.5, 0.2],
          } : { scale: 2.5, opacity: 0 }}
          transition={phase === "logo"
            ? { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
            : { duration: 0.7, ease: "easeOut" }
          }
        />

        {/* Logo image */}
        <motion.img
          src={gameLogo}
          alt="TicTacToe"
          width={180}
          height={180}
          className="relative z-10 rounded-[2rem]"
          style={{ width: 180, height: 180 }}
          initial={{ scale: 0, rotate: -30, opacity: 0 }}
          animate={phase === "burst" || phase === "done"
            ? { scale: [1, 1.2, 0], rotate: [0, 10, 0], opacity: [1, 1, 0] }
            : { scale: 1, rotate: 0, opacity: 1 }
          }
          transition={phase === "logo"
            ? { type: "spring", stiffness: 200, damping: 15, delay: 0.2 }
            : { duration: 0.6, ease: "easeInOut" }
          }
        />

        {/* Glow under logo */}
        <motion.div
          className="absolute z-0 rounded-full blur-[60px]"
          style={{
            width: 160,
            height: 160,
            background: "linear-gradient(135deg, hsl(265, 90%, 55%), hsl(330, 85%, 55%))",
          }}
          animate={phase === "logo"
            ? { opacity: [0.15, 0.35, 0.15], scale: [0.9, 1.1, 0.9] }
            : { opacity: 0, scale: 2 }
          }
          transition={phase === "logo"
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.5 }
          }
        />

        {/* Title text */}
        <motion.div
          className="mt-8 text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={phase === "burst" || phase === "done"
            ? { opacity: 0, y: -20 }
            : { opacity: 1, y: 0 }
          }
          transition={{ delay: phase === "logo" ? 0.6 : 0, duration: 0.5 }}
        >
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tighter text-gradient-title"
            style={{ fontFamily: "'Space Grotesk', 'JetBrains Mono', monospace" }}
          >
            TicTacToe
          </h1>
          <motion.p
            className="text-xs sm:text-sm text-muted-foreground/60 mt-2 font-medium tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "logo" ? 1 : 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            Battle • Compete • Conquer
          </motion.p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="flex gap-2 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "logo" ? 1 : 0 }}
          transition={{ delay: 1.2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/60"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
