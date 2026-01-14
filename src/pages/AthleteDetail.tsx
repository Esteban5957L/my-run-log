import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MessageSquare,
  TrendingUp,
  Clock,
  Mountain,
  Heart,
  Zap,
  Calendar,
  MapPin,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { athleteService } from '@/services/athlete.service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { AthleteDetail as AthleteDetailType } from '@/types/athlete';
import type { Activity } from '@/types/activity';
import { ACTIVITY_TYPE_LABELS } from '@/types/activity';

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(2) + ' km';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatPace(pace: number | null | undefined): string {
  if (!pace) return '-';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function AthleteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<AthleteDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadAthleteDetail(id);
    }
  }, [id]);

  const loadAthleteDetail = async (athleteId: string) => {
    try {
      const detail = await athleteService.getAthleteDetail(athleteId);
      setData(detail);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la información del atleta',
      });
      navigate('/coach');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAthlete = async () => {
    if (!id) return;
    try {
      await athleteService.removeAthlete(id);
      toast({
        title: 'Atleta eliminado',
        description: 'El atleta ha sido removido de tu equipo',
      });
      navigate('/coach');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo eliminar al atleta',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { athlete, stats, recentActivities, activePlans } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/coach">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={athlete.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-trail text-primary-foreground">
                    {getInitials(athlete.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-display text-xl">{athlete.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{athlete.email}</span>
                    {athlete.stravaConnected && (
                      <Badge variant="secondary" className="text-xs">Strava</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to={`/coach/chat/${athlete.id}`}>
                <Button variant="outline">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar atleta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Distancia mensual</span>
            </div>
            <div className="font-display text-2xl text-foreground">
              {formatDistance(stats.monthly.distance)}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-energy" />
              <span className="text-xs text-muted-foreground">Tiempo mensual</span>
            </div>
            <div className="font-display text-2xl text-foreground">
              {formatDuration(stats.monthly.duration)}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mountain className="w-4 h-4 text-summit" />
              <span className="text-xs text-muted-foreground">Desnivel +</span>
            </div>
            <div className="font-display text-2xl text-foreground">
              {stats.monthly.elevation.toLocaleString()}m
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-trail" />
              <span className="text-xs text-muted-foreground">Entrenos</span>
            </div>
            <div className="font-display text-2xl text-foreground">
              {stats.monthly.workouts}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-road" />
              <span className="text-xs text-muted-foreground">Ritmo medio</span>
            </div>
            <div className="font-display text-2xl text-foreground">
              {formatPace(stats.monthly.avgPace)}
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">FC media</span>
            </div>
            <div className="font-display text-2xl text-foreground">
              {stats.monthly.avgHeartRate ? `${Math.round(stats.monthly.avgHeartRate)} bpm` : '-'}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="activities">Actividades</TabsTrigger>
            <TabsTrigger value="plans">Planes</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {recentActivities.length === 0 ? (
                <div className="text-center py-12 glass rounded-xl">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-display text-lg text-foreground mb-2">Sin actividades</h4>
                  <p className="text-muted-foreground">
                    Este atleta aún no tiene actividades registradas
                  </p>
                </div>
              ) : (
                recentActivities.map((activity: Activity, index: number) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-display text-lg text-foreground">{activity.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(activity.date)}
                          {activity.locationName && (
                            <>
                              <MapPin className="w-4 h-4 ml-2" />
                              {activity.locationName}
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {ACTIVITY_TYPE_LABELS[activity.activityType] || activity.activityType}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Distancia</div>
                        <div className="font-display text-lg text-foreground">
                          {formatDistance(activity.distance)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Tiempo</div>
                        <div className="font-display text-lg text-foreground">
                          {formatDuration(activity.duration)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Ritmo</div>
                        <div className="font-display text-lg text-foreground">
                          {formatPace(activity.avgPace)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Desnivel</div>
                        <div className="font-display text-lg text-foreground">
                          +{activity.elevationGain}m
                        </div>
                      </div>
                      {activity.avgHeartRate && (
                        <div>
                          <div className="text-xs text-muted-foreground">FC media</div>
                          <div className="font-display text-lg text-foreground">
                            {activity.avgHeartRate} bpm
                          </div>
                        </div>
                      )}
                    </div>

                    {activity.coachFeedback && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="text-xs text-muted-foreground mb-1">Tu feedback</div>
                        <p className="text-sm text-foreground">{activity.coachFeedback}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="plans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {activePlans.length === 0 ? (
                <div className="text-center py-12 glass rounded-xl">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-display text-lg text-foreground mb-2">Sin planes activos</h4>
                  <p className="text-muted-foreground mb-4">
                    Este atleta no tiene planes de entrenamiento asignados
                  </p>
                  <Button variant="hero">
                    Crear Plan
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePlans.map((plan: any) => (
                    <div key={plan.id} className="glass rounded-xl p-5">
                      <h4 className="font-display text-lg text-foreground">{plan.name}</h4>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="stats">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-6"
            >
              <h4 className="font-display text-lg text-foreground mb-4">Comparativa semanal</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Esta semana</div>
                  <div className="font-display text-2xl text-foreground">
                    {formatDistance(stats.weekly.distance)}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Tiempo</div>
                  <div className="font-display text-2xl text-foreground">
                    {formatDuration(stats.weekly.duration)}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Desnivel</div>
                  <div className="font-display text-2xl text-foreground">
                    {stats.weekly.elevation}m
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Entrenos</div>
                  <div className="font-display text-2xl text-foreground">
                    {stats.weekly.workouts}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar atleta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desvinculará a {athlete.name} de tu equipo. El atleta no perderá sus datos,
              pero ya no podrás ver sus actividades ni comunicarte con él.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAthlete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
