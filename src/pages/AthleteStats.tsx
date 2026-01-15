import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  BarChart3,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { goalService, MonthlyStats, WeeklyStats } from '@/services/goal.service';
import { exportService } from '@/services/export.service';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';

export default function AthleteStats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [months, setMonths] = useState('6');
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [comparison, setComparison] = useState({ distance: 0, duration: 0, workouts: 0 });

  useEffect(() => {
    loadStats();
  }, [months]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const response = await goalService.getHistoricalStats(parseInt(months));
      setMonthlyStats(response.monthly);
      setWeeklyStats(response.weekly);
      setComparison(response.comparison);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (km: number) => `${km.toFixed(1)} km`;
  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };
  const formatPace = (secondsPerKm: number | null) => {
    if (!secondsPerKm) return '-';
    const min = Math.floor(secondsPerKm / 60);
    const sec = Math.round(secondsPerKm % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const ComparisonBadge = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    if (value === 0) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Minus className="w-3 h-3 mr-1" />
          Sin cambio
        </Badge>
      );
    }
    if (value > 0) {
      return (
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{value}{suffix}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/20 text-red-600 border-red-500/30">
        <TrendingDown className="w-3 h-3 mr-1" />
        {value}{suffix}
      </Badge>
    );
  };

  // Preparar datos para gráficos
  const chartData = monthlyStats.map(m => ({
    name: `${m.month} ${m.year !== new Date().getFullYear() ? m.year : ''}`.trim(),
    distancia: parseFloat(m.distance.toFixed(1)),
    tiempo: parseFloat((m.duration / 3600).toFixed(1)),
    entrenos: m.workouts,
    desnivel: m.elevation,
    ritmo: m.avgPace ? parseFloat((m.avgPace / 60).toFixed(2)) : null,
    fc: m.avgHeartRate ? Math.round(m.avgHeartRate) : null,
  }));

  const weeklyChartData = weeklyStats.map(w => ({
    name: w.week,
    distancia: parseFloat(w.distance.toFixed(1)),
    tiempo: parseFloat((w.duration / 3600).toFixed(1)),
    entrenos: w.workouts,
  }));

  // Totales del período
  const totals = monthlyStats.reduce(
    (acc, m) => ({
      distance: acc.distance + m.distance,
      duration: acc.duration + m.duration,
      workouts: acc.workouts + m.workouts,
      elevation: acc.elevation + m.elevation,
    }),
    { distance: 0, duration: 0, workouts: 0, elevation: 0 }
  );

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
                <h1 className="font-display text-xl">MI EVOLUCIÓN</h1>
                <p className="text-xs text-muted-foreground">
                  Estadísticas históricas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={months} onValueChange={setMonths}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">1 año</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  exportService.exportMonthlyStatsToCSV(
                    monthlyStats.map(m => ({
                      ...m,
                      distance: m.distance * 1000, // Convert to meters for the export function
                      duration: m.duration * 3600, // Convert to seconds
                    }))
                  );
                  toast({ title: 'Exportado', description: 'Estadísticas descargadas como CSV' });
                }}
                title="Exportar CSV"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : monthlyStats.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="font-display text-xl mb-2">Sin datos</h2>
            <p className="text-muted-foreground">
              No hay actividades registradas en este período.
            </p>
          </div>
        ) : (
          <>
            {/* Comparison with previous month */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Comparativa vs mes anterior
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Distancia</p>
                      <ComparisonBadge value={comparison.distance} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Tiempo</p>
                      <ComparisonBadge value={comparison.duration} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Entrenos</p>
                      <ComparisonBadge value={comparison.workouts} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Period totals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-display">{formatDistance(totals.distance)}</p>
                  <p className="text-xs text-muted-foreground">Distancia total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-display">{formatDuration(totals.duration / 3600)}</p>
                  <p className="text-xs text-muted-foreground">Tiempo total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-display">{totals.workouts}</p>
                  <p className="text-xs text-muted-foreground">Entrenos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-display">{totals.elevation.toLocaleString()}m</p>
                  <p className="text-xs text-muted-foreground">Desnivel +</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Charts */}
            <Tabs defaultValue="distance" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                <TabsTrigger value="distance">Distancia</TabsTrigger>
                <TabsTrigger value="duration">Tiempo</TabsTrigger>
                <TabsTrigger value="workouts">Entrenos</TabsTrigger>
                <TabsTrigger value="weekly">Semanal</TabsTrigger>
              </TabsList>

              <TabsContent value="distance">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Evolución de Distancia (km)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [`${value} km`, 'Distancia']}
                            />
                            <Area
                              type="monotone"
                              dataKey="distancia"
                              stroke="hsl(var(--primary))"
                              fillOpacity={1}
                              fill="url(#colorDistance)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="duration">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Evolución de Tiempo (horas)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                              formatter={(value: number) => [`${value} h`, 'Tiempo']}
                            />
                            <Area
                              type="monotone"
                              dataKey="tiempo"
                              stroke="#22c55e"
                              fillOpacity={1}
                              fill="url(#colorDuration)"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="workouts">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Entrenos por Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
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
                            <Bar dataKey="entrenos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="weekly">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Últimas 4 Semanas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyChartData}>
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
                            <Bar dataKey="distancia" name="Distancia (km)" fill="#f97316" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="entrenos" name="Entrenos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>

            {/* Monthly breakdown table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Desglose Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-2 font-medium">Mes</th>
                          <th className="text-right py-3 px-2 font-medium">Distancia</th>
                          <th className="text-right py-3 px-2 font-medium">Tiempo</th>
                          <th className="text-right py-3 px-2 font-medium">Entrenos</th>
                          <th className="text-right py-3 px-2 font-medium">Desnivel</th>
                          <th className="text-right py-3 px-2 font-medium">Ritmo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...monthlyStats].reverse().map((m, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium">
                              {m.month} {m.year !== new Date().getFullYear() && m.year}
                            </td>
                            <td className="text-right py-3 px-2 font-mono">
                              {formatDistance(m.distance)}
                            </td>
                            <td className="text-right py-3 px-2 font-mono">
                              {formatDuration(m.duration / 3600)}
                            </td>
                            <td className="text-right py-3 px-2 font-mono">
                              {m.workouts}
                            </td>
                            <td className="text-right py-3 px-2 font-mono">
                              {m.elevation.toLocaleString()}m
                            </td>
                            <td className="text-right py-3 px-2 font-mono">
                              {formatPace(m.avgPace)} /km
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
