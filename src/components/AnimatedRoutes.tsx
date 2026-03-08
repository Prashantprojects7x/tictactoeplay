import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Shop from "@/pages/Shop";
import Friends from "@/pages/Friends";
import BattlePass from "@/pages/BattlePass";
import Tournament from "@/pages/Tournament";
import Achievements from "@/pages/Achievements";
import NotFound from "@/pages/NotFound";

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
        <Route path="/friends" element={<PageTransition><Friends /></PageTransition>} />
        <Route path="/battlepass" element={<PageTransition><BattlePass /></PageTransition>} />
        <Route path="/tournament" element={<PageTransition><Tournament /></PageTransition>} />
        <Route path="/achievements" element={<PageTransition><Achievements /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
