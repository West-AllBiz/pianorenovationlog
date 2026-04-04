import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Catalogue from "./pages/Catalogue";
import CatalogueDetail from "./pages/CatalogueDetail";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import PianoDetail from "./pages/PianoDetail";
import RenovationBoard from "./pages/RenovationBoard";
import CalendarPage from "./pages/CalendarPage";
import Reports from "./pages/Reports";
import Team from "./pages/Team";
import SettingsPage from "./pages/SettingsPage";
import AcquisitionTriage from "./pages/AcquisitionTriage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/triage" element={<AcquisitionTriage />} />
      <Route path="/piano/:id" element={<PianoDetail />} />
      <Route path="/renovation" element={<RenovationBoard />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/team" element={<Team />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>
);

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
