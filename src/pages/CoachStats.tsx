import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { athleteService } from '@/services/athlete.service';
import { RunnioLogo } from '@/components/ui/RunnioLogo';
import type { Athlete } from '@/types/athlete';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface MonthlyStats {
  month: string;
  distance: number;
  duration: number;
  workouts: number;
  elevation: number;
}

interface AthleteWithMonthlyStats extends Athlete {
  monthlyStats?: MonthlyStats[];
}

export default function CoachStats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [athletes, setAthletes] = useState<AthleteWithMonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      setIsLoading(true);
      const response = await athleteService.getMyAthletes();
      setAthletes(response.athletes);
      // Select first 3 athletes by default for comparison
      if (response.athletes.length > 0) {
        setSelectedAthletes(response.athletes.slice(0, 3).map(a => a.id));
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los atletas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthletes(prev => {
      if (prev.includes(athleteId)) {
        return prev.filter(id => id !== athleteId);
      }
      if (prev.length >= 5) {
        toast({
          title: 'Límite alcanzado',
          description: 'Solo puedes comparar hasta 5 atletas',
        });
        return prev;
      }
      return [...prev, athleteId];
    });
  };

  const selectedAthletesData = athletes.filter(a => selectedAthletes.includes(a.id));

  // Data for comparison bar chart
  const comparisonData = selectedAthletesData.map(athlete => ({
    name: athlete.name.split(' ')[0], // First name only
    distancia: Number((athlete.weeklyStats.distance / 1000).toFixed(1)),
    tiempo: Math.round(athlete.weeklyStats.duration / 60), // minutes
    entrenos: athlete.weeklyStats.workouts,
    desnivel: athlete.weeklyStats.elevation,
  }));

  // Data for radar chart (normalized 0-100)
  const maxValues = {
    distance: Math.max(...selectedAthletesData.map(a => a.weeklyStats.distance), 1),
    duration: Math.max(...selectedAthletesData.map(a => a.weeklyStats.duration), 1),
    workouts: Math.max(...selectedAthletesData.map(a => a.weeklyStats.workouts), 1),
    elevation: Math.max(...selectedAthletesData.map(a => a.weeklyStats.elevation), 1),
  };

  const radarData = [
    { metric: 'Distancia', fullMark: 100, ...Object.fromEntries(
      selectedAthletesData.map(a => [a.name.split(' ')[0], Math.round((a.weeklyStats.distance / maxValues.distance) * 100)])
    )},
    { metric: 'Tiempo', fullMark: 100, ...Object.fromEntries(
      selectedAthletesData.map(a => [a.name.split(' ')[0], Math.round((a.weeklyStats.duration / maxValues.duration) * 100)])
    )},
    { metric: 'Entrenos', fullMark: 100, ...Object.fromEntries(
      selectedAthletesData.map(a => [a.name.split(' ')[0], Math.round((a.weeklyStats.workouts / maxValues.workouts) * 100)])
    )},
    { metric: 'Desnivel', fullMark: 100, ...Object.fromEntries(
      selectedAthletesData.map(a => [a.name.split(' ')[0], Math.round((a.weeklyStats.elevation / maxValues.elevation) * 100)])
    )},
  ];

  // Generate colors for athletes
  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ef4444'];

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + ' km';
    }
    return meters.toFixed(0) + ' m';
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
              <Button variant="ghost" size="icon" onClick={() => navigate('/coach')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <RunnioLogo size="sm" showText={false} />
              <div>
                <h1 className="font-display text-xl">ESTADÍSTICAS</h1>
                <p className="text-xs text-muted-foreground">
                  Compara el rendimiento de tus atletas
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {athletes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="font-display text-xl mb-2">Sin atletas</h2>
            <p className="text-muted-foreground mb-6">
              Invita atletas para poder ver sus estadísticas.
            </p>
            <Button onClick={() => navigate('/coach')}>Volver al dashboard</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Athlete selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Selecciona atletas para comparar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {athletes.map((athlete, index) => {
                      const isSelected = selectedAthletes.includes(athlete.id);
                      const colorIndex = selectedAthletes.indexOf(athlete.id);
                      return (
                        <button
                          key={athlete.id}
                          onClick={() => toggleAthleteSelection(athlete.id)}
                          className={`px-3 py-2 rounded-lg border transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/10 text-primary' 
                              : 'border-border hover:border-primary/50'
                          }`}
                          style={isSelected ? { borderColor: COLORS[colorIndex] } : {}}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[colorIndex] }}
                              />
                            )}
                            <span className="text-sm font-medium">{athlete.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedAthletes.length}/5 atletas seleccionados
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {selectedAthletes.length > 0 && (
              <Tabs defaultValue="comparison" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-flex">
                  <TabsTrigger value="comparison" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Comparativa Semanal
                  </TabsTrigger>
                  <TabsTrigger value="radar" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Radar de Rendimiento
                  </TabsTrigger>
                </TabsList>

                {/* Weekly Comparison */}
                <TabsContent value="comparison">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid gap-4"
                  >
                    {/* Distance comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Distancia Semanal (km)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis type="number" className="text-xs" />
                              <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Bar dataKey="distancia" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Multi-metric comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Comparativa General</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="name" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                              <Legend />
                              <Bar dataKey="distancia" name="Distancia (km)" fill="#f97316" />
                              <Bar dataKey="entrenos" name="Entrenos" fill="#22c55e" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stats table */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Resumen Semanal</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-medium">Atleta</th>
                                <th className="text-right py-3 px-4 font-medium">Distancia</th>
                                <th className="text-right py-3 px-4 font-medium">Tiempo</th>
                                <th className="text-right py-3 px-4 font-medium">Entrenos</th>
                                <th className="text-right py-3 px-4 font-medium">Desnivel</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedAthletesData.map((athlete, index) => (
                                <tr key={athlete.id} className="border-b border-border/50 hover:bg-muted/50">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: COLORS[index] }}
                                      />
                                      {athlete.name}
                                    </div>
                                  </td>
                                  <td className="text-right py-3 px-4 font-mono">
                                    {formatDistance(athlete.weeklyStats.distance)}
                                  </td>
                                  <td className="text-right py-3 px-4 font-mono">
                                    {formatDuration(athlete.weeklyStats.duration)}
                                  </td>
                                  <td className="text-right py-3 px-4 font-mono">
                                    {athlete.weeklyStats.workouts}
                                  </td>
                                  <td className="text-right py-3 px-4 font-mono">
                                    {athlete.weeklyStats.elevation}m
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>

                {/* Radar Chart */}
                <TabsContent value="radar">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Radar de Rendimiento</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Valores normalizados (0-100) basados en el mejor rendimiento del grupo
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid className="stroke-muted" />
                              <PolarAngleAxis dataKey="metric" className="text-xs" />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                              {selectedAthletesData.map((athlete, index) => (
                                <Radar
                                  key={athlete.id}
                                  name={athlete.name.split(' ')[0]}
                                  dataKey={athlete.name.split(' ')[0]}
                                  stroke={COLORS[index]}
                                  fill={COLORS[index]}
                                  fillOpacity={0.2}
                                />
                              ))}
                              <Legend />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'hsl(var(--card))', 
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: '8px',
                                }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap gap-4 justify-center">
                      {selectedAthletesData.map((athlete, index) => (
                        <div key={athlete.id} className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: COLORS[index] }}
                          />
                          <span className="text-sm">{athlete.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
