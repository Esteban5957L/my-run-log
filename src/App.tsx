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
import Templates from "./pages/Templates";
import CoachStats from "./pages/CoachStats";

// Activity pages
import ActivityDetail from "./pages/ActivityDetail";

// Goals and Stats pages
import Goals from "./pages/Goals";
import AthleteStats from "./pages/AthleteStats";

// Profile page
import Profile from "./pages/Profile";

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
      <Route path="/coach/calendar" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <CalendarView />
        </ProtectedRoute>
      } />
      <Route path="/coach/activity/:activityId" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <ActivityDetail />
        </ProtectedRoute>
      } />
      <Route path="/coach/templates" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <Templates />
        </ProtectedRoute>
      } />
      <Route path="/coach/stats" element={
        <ProtectedRoute allowedRoles={['COACH']}>
          <CoachStats />
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
      <Route path="/activity/:activityId" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <ActivityDetail />
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
      <Route path="/goals" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <Goals />
        </ProtectedRoute>
      } />
      <Route path="/stats" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <AthleteStats />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['ATHLETE', 'COACH']}>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/gear" element={
        <ProtectedRoute allowedRoles={['ATHLETE']}>
          <GearView />
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
