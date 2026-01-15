import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  TrendingUp,
  Mountain,
  Heart,
  Zap,
  Calendar,
  MapPin,
  Activity as ActivityIcon,
  MessageSquare,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Map,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { activityService } from '@/services/activity.service';
import { Activity, ACTIVITY_TYPE_LABELS } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { RunnioLogo } from '@/components/ui/RunnioLogo';

function formatDistance(km: number): string {
  return km.toFixed(2) + ' km';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
}

function formatPace(secondsPerKm: number | null | undefined): string {
  if (!secondsPerKm || secondsPerKm === 0) return '-';
  const totalMinutes = secondsPerKm / 60;
  const minutes = Math.floor(totalMinutes);
  const secs = Math.round((totalMinutes - minutes) * 60);
  return `${minutes}:${secs.toString().padStart(2, '0')} /km`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Split {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  average_speed: number;
  average_heartrate?: number;
  pace_zone?: number;
  split: number;
  elevation_difference?: number;
}

export default function ActivityDetail() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [showAllSplits, setShowAllSplits] = useState(false);

  const isCoach = user?.role === 'COACH';

  useEffect(() => {
    if (activityId) {
      loadActivity(activityId);
    }
  }, [activityId]);

  const loadActivity = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await activityService.getActivity(id);
      if (response?.activity) {
        setActivity(response.activity);
        setFeedback(response.activity.coachFeedback || '');
      } else {
        throw new Error('Activity not found');
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar la actividad',
      });
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!activity || !feedback.trim()) return;
    
    setIsSendingFeedback(true);
    try {
      await activityService.addCoachFeedback(activity.id, feedback);
      setActivity({ ...activity, coachFeedback: feedback });
      toast({
        title: 'Feedback enviado',
        description: 'El atleta podrá ver tu comentario',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar el feedback',
      });
    } finally {
      setIsSendingFeedback(false);
    }
  };

  // Parsear splits
  const splits: Split[] = useMemo(() => {
    if (!activity?.splits) return [];
    try {
      return typeof activity.splits === 'string' 
        ? JSON.parse(activity.splits) 
        : activity.splits;
    } catch {
      return [];
    }
  }, [activity?.splits]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-display mb-2">Actividad no encontrada</h2>
          <Button onClick={() => navigate(-1)}>Volver</Button>
        </div>
      </div>
    );
  }

  const displayedSplits = showAllSplits ? splits : splits.slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <RunnioLogo size="sm" showText={false} />
              <div>
                <h1 className="font-display text-xl truncate max-w-[200px] sm:max-w-none">
                  {activity.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {formatDate(activity.date)}
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              {ACTIVITY_TYPE_LABELS[activity.activityType] || activity.activityType}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Mapa placeholder */}
        {activity.mapPolyline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="h-[200px] flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <Map className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Mapa del recorrido disponible</p>
                  {activity.startLat && activity.startLng && (
                    <p className="text-xs mt-1">
                      Inicio: {activity.startLat.toFixed(4)}, {activity.startLng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Stats principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="font-display text-2xl">{formatDistance(activity.distance)}</p>
              <p className="text-xs text-muted-foreground">Distancia</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-energy" />
              <p className="font-display text-2xl">{formatDuration(activity.duration)}</p>
              <p className="text-xs text-muted-foreground">Tiempo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-summit" />
              <p className="font-display text-2xl">{formatPace(activity.avgPace)}</p>
              <p className="text-xs text-muted-foreground">Ritmo medio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Mountain className="w-6 h-6 mx-auto mb-2 text-trail" />
              <p className="font-display text-2xl">{activity.elevationGain}m</p>
              <p className="text-xs text-muted-foreground">Desnivel +</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats secundarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 md:grid-cols-6 gap-4"
        >
          {activity.avgHeartRate && (
            <Card>
              <CardContent className="p-3 text-center">
                <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                <p className="font-display text-lg">{activity.avgHeartRate}</p>
                <p className="text-[10px] text-muted-foreground">FC Media</p>
              </CardContent>
            </Card>
          )}
          {activity.maxHeartRate && (
            <Card>
              <CardContent className="p-3 text-center">
                <Heart className="w-4 h-4 mx-auto mb-1 text-red-600" />
                <p className="font-display text-lg">{activity.maxHeartRate}</p>
                <p className="text-[10px] text-muted-foreground">FC Máx</p>
              </CardContent>
            </Card>
          )}
          {activity.calories && (
            <Card>
              <CardContent className="p-3 text-center">
                <Zap className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                <p className="font-display text-lg">{activity.calories}</p>
                <p className="text-[10px] text-muted-foreground">Calorías</p>
              </CardContent>
            </Card>
          )}
          {activity.elevationLoss > 0 && (
            <Card>
              <CardContent className="p-3 text-center">
                <Mountain className="w-4 h-4 mx-auto mb-1 text-blue-500 rotate-180" />
                <p className="font-display text-lg">{activity.elevationLoss}m</p>
                <p className="text-[10px] text-muted-foreground">Desnivel -</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Tabla de Splits */}
        {splits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Splits por Kilómetro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-4 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                    <span>Km</span>
                    <span>Tiempo</span>
                    <span>Ritmo</span>
                    <span>FC</span>
                  </div>
                  {displayedSplits.map((split, index) => {
                    const pace = split.moving_time / (split.distance / 1000);
                    return (
                      <div 
                        key={index} 
                        className="grid grid-cols-4 text-sm py-2 border-b border-border/50"
                      >
                        <span className="font-medium">{index + 1}</span>
                        <span>{formatDuration(split.moving_time)}</span>
                        <span className="text-primary">{formatPace(pace)}</span>
                        <span className="text-red-500">
                          {split.average_heartrate ? `${Math.round(split.average_heartrate)}` : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {splits.length > 5 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-4"
                    onClick={() => setShowAllSplits(!showAllSplits)}
                  >
                    {showAllSplits ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-2" />
                        Ver menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Ver todos ({splits.length} km)
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Notas del atleta */}
        {activity.notes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{activity.notes}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Feedback del Coach */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Feedback del Entrenador
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isCoach ? (
                <div className="space-y-4">
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escribe un comentario para el atleta..."
                    rows={3}
                  />
                  <Button 
                    onClick={handleSendFeedback}
                    disabled={isSendingFeedback || !feedback.trim()}
                  >
                    {isSendingFeedback ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Feedback
                      </>
                    )}
                  </Button>
                </div>
              ) : activity.coachFeedback ? (
                <div className="bg-primary/10 rounded-lg p-4">
                  <p className="text-foreground">{activity.coachFeedback}</p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Tu entrenador aún no ha dejado comentarios
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Info adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-muted-foreground pb-8"
        >
          <p>
            <Calendar className="w-3 h-3 inline mr-1" />
            {formatDate(activity.date)} a las {formatTime(activity.date)}
          </p>
          {activity.stravaId && (
            <p className="mt-1">
              <ActivityIcon className="w-3 h-3 inline mr-1" />
              Sincronizado desde Strava
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
