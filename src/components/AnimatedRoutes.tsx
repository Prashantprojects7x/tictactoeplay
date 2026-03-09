import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import PageTransition from "./PageTransition";
import { useAuth } from "@/contexts/AuthContext";

// Eagerly load splash & auth (initial routes)
import Splash from "@/pages/Splash";
import Auth from "@/pages/Auth";

// Lazy load all other routes
const Index = lazy(() => import("@/pages/Index"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const Shop = lazy(() => import("@/pages/Shop"));
const Friends = lazy(() => import("@/pages/Friends"));
const BattlePass = lazy(() => import("@/pages/BattlePass"));
const Tournament = lazy(() => import("@/pages/Tournament"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Seasons = lazy(() => import("@/pages/Seasons"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
      <Suspense fallback={null}>
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
      </Suspense>
    </AnimatePresence>
  );
}
