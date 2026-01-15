import { motion } from 'framer-motion';
import { Plus, TrendingUp, Mountain, Clock, Activity, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { WeeklyChart } from '@/components/dashboard/WeeklyChart';
import { UpcomingRace } from '@/components/dashboard/UpcomingRace';
import { MiniMap } from '@/components/dashboard/MiniMap';
import { mockWorkouts, mockRaces, mockWeeklyStats, getMonthStats } from '@/data/mockData';
import { formatPace, formatDurationLong } from '@/lib/workout-utils';

export default function Dashboard() {
  const monthStats = getMonthStats(mockWorkouts);
  const upcomingRace = mockRaces.find((r) => r.status === 'upcoming');
  const recentWorkouts = mockWorkouts.slice(0, 4);
  
  const currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">DASHBOARD</h1>
          <p className="text-muted-foreground capitalize">{currentMonth}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="hero" size="lg" asChild>
            <Link to="/log">
              <Plus className="w-5 h-5" />
              Registrar Entrenamiento
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/races">
              <Trophy className="w-5 h-5" />
              Mis Carreras
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={TrendingUp}
          label="Distancia"
          value={monthStats.totalDistance.toFixed(1)}
          unit="km"
          trend={12}
          variant="primary"
          delay={0}
        />
        <StatsCard
          icon={Mountain}
          label="Desnivel"
          value={monthStats.totalElevation.toLocaleString()}
          unit="m"
          trend={8}
          variant="secondary"
          delay={0.1}
        />
        <StatsCard
          icon={Clock}
          label="Tiempo"
          value={formatDurationLong(monthStats.totalDuration)}
          variant="accent"
          delay={0.2}
        />
        <StatsCard
          icon={Activity}
          label="Entrenamientos"
          value={monthStats.workoutCount}
          variant="default"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Recent Activities */}
        <div className="lg:col-span-2 space-y-6">
          <WeeklyChart data={mockWeeklyStats} />
          
          {/* Recent Activities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-foreground">ACTIVIDAD RECIENTE</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/history">Ver todo</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {recentWorkouts.map((workout, index) => (
                <ActivityCard key={workout.id} workout={workout} index={index} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Race & Map */}
        <div className="space-y-6">
          {upcomingRace && <UpcomingRace race={upcomingRace} />}
          <MiniMap workouts={mockWorkouts} />
          
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="font-display text-xl text-foreground mb-4">RITMO PROMEDIO</h3>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl text-gradient-trail">
                {monthStats.avgPace > 0 ? formatPace(monthStats.avgPace) : '--:--'}
              </span>
              <span className="text-muted-foreground">/km</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Este mes • {monthStats.workoutCount} entrenamientos
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
