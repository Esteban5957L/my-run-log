import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";

// Layouts
import { AppLayout } from "./components/layout/AppLayout";

// Public pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Coach pages
import CoachDashboard from "./pages/CoachDashboard";
import AthleteDetail from "./pages/AthleteDetail";

// Chat pages
import Conversations from "./pages/Conversations";
import Chat from "./pages/Chat";

// Athlete pages
import AthleteDashboard from "./pages/AthleteDashboard";
import Settings from "./pages/Settings";
import LogWorkout from "./pages/LogWorkout";
import MapView from "./pages/MapView";
import CalendarView from "./pages/CalendarView";
import StatsView from "./pages/StatsView";
import GoalsView from "./pages/GoalsView";
import GearView from "./pages/GearView";
import NotFound from "./pages/NotFound";

// Plan pages
import Plans from "./pages/Plans";
import PlanForm from "./pages/PlanForm";
import PlanDetail from "./pages/PlanDetail";

const queryClient = new QueryClient();

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'COACH' ? '/coach' : '/'} replace />;
  }

  return <>{children}</>;
}

// Public Route - redirects if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={user.role === 'COACH' ? '/coach' : '/'} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Coach routes */}
      <Route path="/coach" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <CoachDashboard />
        </ProtectedRoute>
      } />
      <Route path="/coach/athlete/:id" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <AthleteDetail />
        </ProtectedRoute>
      } />
      <Route path="/coach/messages" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <Conversations />
        </ProtectedRoute>
      } />
      <Route path="/coach/chat/:oderId" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <Chat />
        </ProtectedRoute>
      } />
      <Route path="/coach/plans" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <Plans />
        </ProtectedRoute>
      } />
      <Route path="/coach/plans/new" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <PlanForm />
        </ProtectedRoute>
      } />
      <Route path="/coach/plans/:planId" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <PlanDetail />
        </ProtectedRoute>
      } />
      <Route path="/coach/plans/:planId/edit" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <PlanForm />
        </ProtectedRoute>
      } />

      {/* Athlete routes */}
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <AthleteDashboard />
        </ProtectedRoute>
      } />
      <Route path="/activities" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <StatsView />
        </ProtectedRoute>
      } />
      <Route path="/log" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <LogWorkout />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <CalendarView />
        </ProtectedRoute>
      } />
      <Route path="/plans" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <Plans />
        </ProtectedRoute>
      } />
      <Route path="/plans/:planId" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <PlanDetail />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/settings/strava" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Athlete chat routes (outside layout) */}
      <Route path="/messages" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <Conversations />
        </ProtectedRoute>
      } />
      <Route path="/chat/:oderId" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <Chat />
        </ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ChatProvider>
            <AppRoutes />
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
