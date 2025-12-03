import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Mountain, Clock, Zap, Award, Target } from 'lucide-react';
import { mockWorkouts, mockWeeklyStats } from '@/data/mockData';
import { ACTIVITY_LABELS, ACTIVITY_COLORS, ActivityType } from '@/types/workout';
import { formatPace } from '@/lib/workout-utils';

export default function StatsView() {
  // Calculate activity distribution
  const activityDistribution = Object.entries(ACTIVITY_LABELS).map(([key, label]) => {
    const count = mockWorkouts.filter(w => w.activityType === key).length;
    return {
      name: label,
      value: count,
      color: ACTIVITY_COLORS[key as ActivityType],
    };
  }).filter(item => item.value > 0);

  // Weekly volume data
  const weeklyVolumeData = mockWeeklyStats.slice(-8).map(week => ({
    name: new Date(week.weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    km: week.totalDistance,
    elevation: week.totalElevation,
  }));

  // Pace progression
  const paceData = mockWeeklyStats.slice(-8).map(week => ({
    name: new Date(week.weekStart).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    pace: week.avgPace ? Math.round(week.avgPace) : 0,
  }));

  // Personal Records
  const prs = {
    fastest5k: { time: '22:45', date: '2025-09-15' },
    fastest10k: { time: '48:30', date: '2025-10-20' },
    longestRun: { distance: 32.5, date: '2025-11-10' },
    maxElevation: { value: 1520, date: '2025-10-05' },
    bestVAM: { value: 1120, date: '2025-11-24' },
  };

  // Total stats
  const totalDistance = mockWorkouts.reduce((sum, w) => sum + w.distance, 0);
  const totalElevation = mockWorkouts.reduce((sum, w) => sum + w.elevationGain, 0);
  const totalDuration = mockWorkouts.reduce((sum, w) => sum + w.duration, 0);
  const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-4xl sm:text-5xl text-foreground">ESTADÍSTICAS</h1>
        <p className="text-muted-foreground">Analiza tu rendimiento y progreso</p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total km</span>
          </div>
          <p className="font-display text-4xl text-foreground">{totalDistance.toFixed(0)}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-sm text-muted-foreground">Desnivel</span>
          </div>
          <p className="font-display text-4xl text-foreground">{(totalElevation / 1000).toFixed(1)}k</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <span className="text-sm text-muted-foreground">Horas</span>
          </div>
          <p className="font-display text-4xl text-foreground">{Math.floor(totalDuration / 3600)}</p>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Zap className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Ritmo Avg</span>
          </div>
          <p className="font-display text-4xl text-foreground">{formatPace(avgPace)}</p>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Volume */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-2xl text-foreground mb-6">VOLUMEN SEMANAL</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="km" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Km" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Elevation Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-2xl text-foreground mb-6">DESNIVEL ACUMULADO</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="elevation"
                  stroke="hsl(var(--secondary))"
                  fill="url(#elevationGradient)"
                  strokeWidth={2}
                  name="Metros"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Activity Distribution & Pace */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-2xl text-foreground mb-6">DISTRIBUCIÓN DE ACTIVIDADES</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {activityDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pace Evolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-2xl text-foreground mb-6">EVOLUCIÓN DEL RITMO</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatPace(value)}
                  reversed
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatPace(value), 'Ritmo']}
                />
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--accent))', strokeWidth: 0, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Personal Records */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-secondary" />
          <h3 className="font-display text-2xl text-foreground">RECORDS PERSONALES</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">5K más rápido</p>
            <p className="font-display text-3xl text-primary">{prs.fastest5k.time}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">10K más rápido</p>
            <p className="font-display text-3xl text-primary">{prs.fastest10k.time}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Carrera más larga</p>
            <p className="font-display text-3xl text-secondary">{prs.longestRun.distance} km</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Mayor desnivel</p>
            <p className="font-display text-3xl text-secondary">{prs.maxElevation.value} m</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Mejor VAM</p>
            <p className="font-display text-3xl text-accent">{prs.bestVAM.value} m/h</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
