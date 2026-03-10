import { motion } from "framer-motion";

interface WinCelebrationProps {
  winStreak: number;
}

// Streak tiers determine visual intensity
function getStreakTier(streak: number) {
  if (streak >= 10) return "legendary";
  if (streak >= 5) return "epic";
  if (streak >= 3) return "hot";
  return "normal";
}

const TIER_COLORS = {
  normal: [
    "hsl(265,90%,65%)", "hsl(165,80%,50%)", "hsl(48,100%,55%)",
    "hsl(330,85%,60%)", "hsl(200,85%,60%)", "hsl(45,100%,70%)",
  ],
  hot: [
    "hsl(25,100%,55%)", "hsl(10,100%,50%)", "hsl(48,100%,55%)",
    "hsl(35,100%,60%)", "hsl(0,85%,55%)", "hsl(55,100%,65%)",
  ],
  epic: [
    "hsl(280,100%,65%)", "hsl(300,100%,55%)", "hsl(320,100%,60%)",
    "hsl(260,100%,70%)", "hsl(200,100%,65%)", "hsl(48,100%,60%)",
  ],
  legendary: [
    "hsl(48,100%,55%)", "hsl(40,100%,50%)", "hsl(55,100%,65%)",
    "hsl(30,100%,55%)", "hsl(45,100%,70%)", "hsl(60,100%,50%)",
  ],
};

// Standard confetti particles
function ConfettiParticles({ tier }: { tier: string }) {
  const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS];
  const count = tier === "legendary" ? 40 : tier === "epic" ? 30 : tier === "hot" ? 25 : 20;

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 2,
    color: colors[i % colors.length],
    size: 4 + Math.random() * (tier === "legendary" ? 8 : 6),
    isCircle: Math.random() > 0.5,
    rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
    drift: (Math.random() - 0.5) * 120,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            x: `calc(${p.x}vw + ${p.drift}px)`,
            opacity: 0,
            rotate: p.rotation,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * (p.isCircle ? 1 : 1.5),
            borderRadius: p.isCircle ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </>
  );
}

// Fire particles for hot streaks (3+)
function FireParticles() {
  const particles = Array.from({ length: 10 }, (_, i) => ({
    id: `fire-${i}`,
    x: 25 + Math.random() * 50,
    size: 10 + Math.random() * 12,
    delay: Math.random() * 1,
    duration: 1 + Math.random() * 1,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "100vh", x: `${p.x}vw`, opacity: 0.8 }}
          animate={{ y: "-20vh", opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size * 1.5,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
            background: `radial-gradient(circle at 50% 70%, hsl(48,100%,55%), hsl(25,100%,55%), hsl(0,100%,45%))`,
          }}
        />
      ))}
    </>
  );
}

// Sparkle burst for epic streaks (5+)
function SparkleBurst() {
  const sparkles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 120 + Math.random() * 150;
    return {
      id: `sparkle-${i}`,
      endX: Math.cos(angle) * distance,
      endY: Math.sin(angle) * distance,
      delay: Math.random() * 0.2,
      size: 3 + Math.random() * 4,
    };
  });

  return (
    <>
      {sparkles.map((s) => (
        <motion.div
          key={s.id}
          initial={{ x: "50vw", y: "50vh", opacity: 1 }}
          animate={{
            x: `calc(50vw + ${s.endX}px)`,
            y: `calc(50vh + ${s.endY}px)`,
            opacity: 0,
          }}
          transition={{ duration: 1, delay: s.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "hsl(48,100%,70%)",
          }}
        />
      ))}
    </>
  );
}

// Shockwave ring for legendary streaks (10+)
function ShockwaveRing() {
  return (
    <>
      {[0, 0.3, 0.6].map((delay, i) => (
        <motion.div
          key={`ring-${i}`}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 1.5, delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 100,
            height: 100,
            marginLeft: -50,
            marginTop: -50,
            borderRadius: "50%",
            border: "3px solid hsl(48,100%,60%)",
            boxShadow: "0 0 20px 5px hsl(48,100%,50%), inset 0 0 20px 5px hsl(48,100%,50%)",
          }}
        />
      ))}
    </>
  );
}

// Streak text banner
function StreakBanner({ streak, tier }: { streak: number; tier: string }) {
  if (streak < 2) return null;

  const label =
    tier === "legendary" ? "🔥 LEGENDARY STREAK!" :
    tier === "epic" ? "⚡ EPIC STREAK!" :
    tier === "hot" ? "🔥 ON FIRE!" :
    "✨ WIN STREAK!";

  const gradient =
    tier === "legendary" ? "from-yellow-300 via-amber-400 to-orange-500" :
    tier === "epic" ? "from-purple-400 via-pink-400 to-fuchsia-500" :
    tier === "hot" ? "from-orange-400 via-red-400 to-rose-500" :
    "from-primary to-accent";

  return (
    <motion.div
      className="absolute top-[15%] left-1/2 z-10"
      initial={{ x: "-50%", y: -40, opacity: 0, scale: 0.5 }}
      animate={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
    >
      <motion.div
        className={`bg-gradient-to-r ${gradient} text-white font-black text-lg sm:text-2xl px-6 py-2 rounded-full shadow-2xl`}
        animate={tier === "legendary" ? {
          boxShadow: [
            "0 0 20px 5px hsl(48,100%,50%)",
            "0 0 40px 10px hsl(48,100%,60%)",
            "0 0 20px 5px hsl(48,100%,50%)",
          ],
        } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {label} x{streak}
      </motion.div>
    </motion.div>
  );
}

export default function WinCelebration({ winStreak }: WinCelebrationProps) {
  const tier = getStreakTier(winStreak);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Always show confetti */}
      <ConfettiParticles tier={tier} />

      {/* Hot streak (3+): fire particles */}
      {(tier === "hot" || tier === "epic" || tier === "legendary") && <FireParticles />}

      {/* Epic streak (5+): sparkle burst from center */}
      {(tier === "epic" || tier === "legendary") && <SparkleBurst />}

      {/* Legendary streak (10+): shockwave rings */}
      {tier === "legendary" && <ShockwaveRing />}

      {/* Streak banner */}
      <StreakBanner streak={winStreak} tier={tier} />
    </motion.div>
  );
}
