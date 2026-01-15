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
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// Decodificar polyline de Google/Strava
function decodePolyline(encoded: string): LatLngExpression[] {
  const points: LatLngExpression[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

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
      setActivity(response.activity);
      setFeedback(response.activity.coachFeedback || '');
    } catch (error) {
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

  // Decodificar polyline para el mapa
  const routePoints = useMemo(() => {
    if (!activity?.mapPolyline) return [];
    try {
      return decodePolyline(activity.mapPolyline);
    } catch {
      return [];
    }
  }, [activity?.mapPolyline]);

  // Calcular bounds del mapa
  const mapBounds = useMemo(() => {
    if (routePoints.length === 0) return null;
    const lats = routePoints.map(p => (p as [number, number])[0]);
    const lngs = routePoints.map(p => (p as [number, number])[1]);
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  }, [routePoints]);

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

  // Datos para gráficos de splits
  const splitsChartData = useMemo(() => {
    return splits.map((split, index) => ({
      km: index + 1,
      pace: split.moving_time / (split.distance / 1000), // segundos por km
      paceFormatted: formatPace(split.moving_time / (split.distance / 1000)),
      heartRate: split.average_heartrate || 0,
      elevation: split.elevation_difference || 0,
    }));
  }, [splits]);

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
        {/* Mapa */}
        {routePoints.length > 0 && mapBounds && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="h-[300px] sm:h-[400px]">
                <MapContainer
                  bounds={mapBounds}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Polyline
                    positions={routePoints}
                    pathOptions={{ color: '#f97316', weight: 4 }}
                  />
                  {activity.startLat && activity.startLng && (
                    <CircleMarker 
                      center={[activity.startLat, activity.startLng]} 
                      radius={8}
                      pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }}
                    >
                      <Popup>Inicio</Popup>
                    </CircleMarker>
                  )}
                </MapContainer>
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

        {/* Gráfico de ritmo por km */}
        {splitsChartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ritmo por Kilómetro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={splitsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="km" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(v) => `${v}km`}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => {
                          const mins = Math.floor(v / 60);
                          const secs = Math.round(v % 60);
                          return `${mins}:${secs.toString().padStart(2, '0')}`;
                        }}
                        domain={['dataMin - 30', 'dataMax + 30']}
                        reversed
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg p-2 text-sm">
                                <p className="font-medium">Km {data.km}</p>
                                <p className="text-primary">{data.paceFormatted}</p>
                                {data.heartRate > 0 && (
                                  <p className="text-red-500">❤️ {data.heartRate} bpm</p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="pace" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Gráfico de frecuencia cardíaca */}
        {splitsChartData.some(d => d.heartRate > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Frecuencia Cardíaca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={splitsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis 
                        dataKey="km" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `${v}km`}
                      />
                      <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-card border border-border rounded-lg p-2 text-sm">
                                <p className="font-medium">Km {data.km}</p>
                                <p className="text-red-500">❤️ {data.heartRate} bpm</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        fill="#ef444433"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabla de Splits */}
        {splits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
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
            transition={{ delay: 0.6 }}
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
          transition={{ delay: 0.7 }}
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
          transition={{ delay: 0.8 }}
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
