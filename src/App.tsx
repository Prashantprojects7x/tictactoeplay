import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AnimatedRoutes from "@/components/AnimatedRoutes";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const [hasSeenSplash, setHasSeenSplash] = useState(() => {
    return sessionStorage.getItem("seen_splash") === "true";
  });

  useEffect(() => {
    if (location.pathname === "/splash") {
      sessionStorage.setItem("seen_splash", "true");
      setHasSeenSplash(true);
    }
  }, [location.pathname]);

  // First visit this session → show splash
  if (!hasSeenSplash && location.pathname === "/") {
    return <Navigate to="/splash" replace />;
  }

  return <main><AnimatedRoutes /></main>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
