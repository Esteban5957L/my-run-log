import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import LogWorkout from "./pages/LogWorkout";
import MapView from "./pages/MapView";
import CalendarView from "./pages/CalendarView";
import StatsView from "./pages/StatsView";
import GoalsView from "./pages/GoalsView";
import GearView from "./pages/GearView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/log" element={<LogWorkout />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/stats" element={<StatsView />} />
            <Route path="/goals" element={<GoalsView />} />
            <Route path="/gear" element={<GearView />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
