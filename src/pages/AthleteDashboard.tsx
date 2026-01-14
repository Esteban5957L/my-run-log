import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  Clock,
  Mountain,
  Flame,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Target,
  Award,
  Heart,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/dashboard.service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RunnioLogo } from '@/components/ui/RunnioLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Activity as ActivityType } from '@/types/activity';
import { ACTIVITY_TYPE_LABELS } from '@/types/activity';

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(1) + ' km';
  }
  return meters + ' m';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatPace(pace: number | null | undefined): string {
  if (!pace) return '-';
  const minutes = Math.floor(pace);
  const secs = Math.round((pace - minutes) * 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  }
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface DashboardData {
  stats: {
    weekly: {
      distance: number;
      duration: number;
      elevation: number;
      workouts: number;
      avgPace: number | null;
    };
    monthly: {
      distance: number;
      duration: number;
      elevation: number;
      workouts: number;
      avgPace: number | null;
      avgHeartRate: number | null;
    };
    weeklyProgress: { day: string; distance: number; duration: number }[];
    streakDays: number;
    totalDistance: number;
    totalWorkouts: number;
  };
  recentActivities: ActivityType[];
  activePlan: {
    id: string;
    name: string;
    description: string | null;
    progressPercent: number;
    completedSessions: number;
    totalSessions: number;
    sessions: any[];
  } | null;
  coach: { id: string; name: string; avatar: string | null } | null;
  stravaConnected: boolean;
  unreadMessages: number;
}

export default function AthleteDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await dashboardService.getAthleteDashboard();
      setData(dashboardData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el dashboard',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular el máximo para el gráfico
  const maxDistance = data?.stats.weeklyProgress 
    ? Math.max(...data.stats.weeklyProgress.map(d => d.distance), 1)
    : 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RunnioLogo size="md" />
              <div>
                <h1 className="font-display text-xl">RUNN.IO</h1>
                <p className="text-xs text-muted-foreground">Mi Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/messages">
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="w-5 h-5" />
                  {data?.unreadMessages && data.unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                      {data.unreadMessages}
                    </span>
                  )}
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.avatar || undefined} />
                      <AvatarFallback className="bg-gradient-trail text-primary-foreground text-sm">
                        {user?.name ? getInitials(user.name) : 'AT'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="font-medium text-sm">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome & Coach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h2 className="font-display text-3xl text-foreground">
              ¡Hola, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-muted-foreground">
              {data?.stats.streakDays && data.stats.streakDays > 0 
                ? `🔥 ${data.stats.streakDays} días de racha` 
                : 'Comienza tu racha de entrenamiento hoy'}
            </p>
          </div>
          {data?.coach && (
            <Link to={`/chat/${data.coach.id}`}>
              <div className="glass rounded-xl p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={data.coach.avatar || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {getInitials(data.coach.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-muted-foreground">Mi entrenador</p>
                  <p className="font-display text-lg">{data.coach.name}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
          )}
        </motion.div>

        {/* Weekly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="font-display text-2xl text-foreground">
              {formatDistance(data?.stats.weekly.distance || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Esta semana</div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-energy/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-energy" />
              </div>
            </div>
            <div className="font-display text-2xl text-foreground">
              {formatDuration(data?.stats.weekly.duration || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Tiempo</div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-summit/20 flex items-center justify-center">
                <Mountain className="w-4 h-4 text-summit" />
              </div>
            </div>
            <div className="font-display text-2xl text-foreground">
              {data?.stats.weekly.elevation || 0}m
            </div>
            <div className="text-xs text-muted-foreground">Desnivel +</div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-trail/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-trail" />
              </div>
            </div>
            <div className="font-display text-2xl text-foreground">
              {data?.stats.weekly.workouts || 0}
            </div>
            <div className="text-xs text-muted-foreground">Entrenos</div>
          </div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-lg mb-4">ACTIVIDAD SEMANAL</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {data?.stats.weeklyProgress.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center justify-end h-24">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.distance / maxDistance) * 100}%` }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                    className="w-full max-w-[40px] bg-gradient-trail rounded-t-lg min-h-[4px]"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">MI PLAN</h3>
              <Link to="/plans">
                <Button variant="ghost" size="sm">
                  Ver todo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {data?.activePlan ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display text-xl text-foreground">{data.activePlan.name}</h4>
                    {data.activePlan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{data.activePlan.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{data.activePlan.progressPercent}%</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="text-foreground">
                      {data.activePlan.completedSessions}/{data.activePlan.totalSessions} sesiones
                    </span>
                  </div>
                  <Progress value={data.activePlan.progressPercent} className="h-2" />
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Próximas sesiones</p>
                  <div className="space-y-2">
                    {data.activePlan.sessions
                      .filter(s => !s.completed)
                      .slice(0, 3)
                      .map((session, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                            <Target className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="text-foreground">{session.description || session.sessionType}</p>
                            {session.targetDistance && (
                              <p className="text-xs text-muted-foreground">
                                {formatDistance(session.targetDistance)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Sin plan activo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tu entrenador te asignará un plan pronto
                </p>
              </div>
            )}
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">ACTIVIDADES RECIENTES</h3>
              <Link to="/activities">
                <Button variant="ghost" size="sm">
                  Ver todo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {data?.recentActivities && data.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-trail flex items-center justify-center flex-shrink-0">
                      <Activity className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{activity.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(activity.date)}</span>
                        <span>•</span>
                        <span>{formatDistance(activity.distance)}</span>
                        <span>•</span>
                        <span>{formatDuration(activity.duration)}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ACTIVITY_TYPE_LABELS[activity.activityType] || activity.activityType}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Sin actividades recientes</p>
                {!data?.stravaConnected && (
                  <Link to="/settings/strava">
                    <Button variant="outline" size="sm" className="mt-3">
                      Conectar Strava
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-lg mb-4">RESUMEN MENSUAL</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-primary" />
              <div className="font-display text-xl">{formatDistance(data?.stats.monthly.distance || 0)}</div>
              <div className="text-xs text-muted-foreground">Distancia</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-2 text-energy" />
              <div className="font-display text-xl">{formatDuration(data?.stats.monthly.duration || 0)}</div>
              <div className="text-xs text-muted-foreground">Tiempo</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Mountain className="w-5 h-5 mx-auto mb-2 text-summit" />
              <div className="font-display text-xl">{data?.stats.monthly.elevation || 0}m</div>
              <div className="text-xs text-muted-foreground">Desnivel</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Activity className="w-5 h-5 mx-auto mb-2 text-trail" />
              <div className="font-display text-xl">{data?.stats.monthly.workouts || 0}</div>
              <div className="text-xs text-muted-foreground">Entrenos</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Zap className="w-5 h-5 mx-auto mb-2 text-road" />
              <div className="font-display text-xl">{formatPace(data?.stats.monthly.avgPace)}</div>
              <div className="text-xs text-muted-foreground">Ritmo /km</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Heart className="w-5 h-5 mx-auto mb-2 text-destructive" />
              <div className="font-display text-xl">
                {data?.stats.monthly.avgHeartRate ? Math.round(data.stats.monthly.avgHeartRate) : '-'}
              </div>
              <div className="text-xs text-muted-foreground">FC media</div>
            </div>
          </div>
        </motion.div>

        {/* Lifetime Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="glass rounded-xl p-4 text-center">
            <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="font-display text-2xl text-foreground">
              {formatDistance(data?.stats.totalDistance || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Distancia total</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-trail" />
            <div className="font-display text-2xl text-foreground">
              {data?.stats.totalWorkouts || 0}
            </div>
            <div className="text-xs text-muted-foreground">Entrenos totales</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-energy" />
            <div className="font-display text-2xl text-foreground">
              {data?.stats.streakDays || 0}
            </div>
            <div className="text-xs text-muted-foreground">Días de racha</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-summit" />
            <div className="font-display text-2xl text-foreground">
              {data?.activePlan?.progressPercent || 0}%
            </div>
            <div className="text-xs text-muted-foreground">Plan completado</div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
