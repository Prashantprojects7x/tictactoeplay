import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import Splash from "@/pages/Splash";
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
import { useAuth } from "@/contexts/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/splash" element={<Splash />} />
        <Route path="/" element={<ProtectedRoute><PageTransition><Index /></PageTransition></ProtectedRoute>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/leaderboard" element={<ProtectedRoute><PageTransition><Leaderboard /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><PageTransition><Shop /></PageTransition></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><PageTransition><Friends /></PageTransition></ProtectedRoute>} />
        <Route path="/battlepass" element={<ProtectedRoute><PageTransition><BattlePass /></PageTransition></ProtectedRoute>} />
        <Route path="/tournament" element={<ProtectedRoute><PageTransition><Tournament /></PageTransition></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><PageTransition><Achievements /></PageTransition></ProtectedRoute>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
