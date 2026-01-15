import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Target,
  TrendingUp,
  Clock,
  Mountain,
  Activity,
  Flame,
  Loader2,
  Trophy,
  Calendar,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { goalService, Goal, GoalType, GoalPeriod } from '@/services/goal.service';
import { RunnioLogo } from '@/components/ui/RunnioLogo';

const GOAL_TYPE_CONFIG: Record<GoalType, { label: string; icon: React.ElementType; unit: string; color: string }> = {
  DISTANCE: { label: 'Distancia', icon: TrendingUp, unit: 'km', color: 'text-primary' },
  DURATION: { label: 'Tiempo', icon: Clock, unit: 'horas', color: 'text-energy' },
  WORKOUTS: { label: 'Entrenos', icon: Activity, unit: 'entrenos', color: 'text-trail' },
  ELEVATION: { label: 'Desnivel', icon: Mountain, unit: 'm', color: 'text-summit' },
  STREAK: { label: 'Racha', icon: Flame, unit: 'días', color: 'text-orange-500' },
};

const GOAL_PERIOD_LABELS: Record<GoalPeriod, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
  CUSTOM: 'Personalizado',
};

export default function Goals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'DISTANCE' as GoalType,
    period: 'MONTHLY' as GoalPeriod,
    title: '',
    description: '',
    targetValue: '',
  });

  useEffect(() => {
    loadGoals();
  }, [showCompletedGoals]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await goalService.getGoals(showCompletedGoals);
      setGoals(response.goals);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las metas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!formData.title.trim() || !formData.targetValue) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Completa todos los campos requeridos',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await goalService.createGoal({
        type: formData.type,
        period: formData.period,
        title: formData.title,
        description: formData.description || undefined,
        targetValue: parseFloat(formData.targetValue),
      });
      
      toast({
        title: '¡Meta creada!',
        description: 'Tu nueva meta ha sido creada exitosamente',
      });
      
      setShowCreateDialog(false);
      setFormData({
        type: 'DISTANCE',
        period: 'MONTHLY',
        title: '',
        description: '',
        targetValue: '',
      });
      loadGoals();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la meta',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalService.deleteGoal(goalId);
      toast({
        title: 'Meta eliminada',
        description: 'La meta ha sido eliminada',
      });
      loadGoals();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la meta',
      });
    }
  };

  const formatValue = (value: number, type: GoalType): string => {
    switch (type) {
      case 'DISTANCE':
        return `${value.toFixed(1)} km`;
      case 'DURATION':
        return `${value.toFixed(1)} h`;
      case 'WORKOUTS':
        return `${Math.round(value)}`;
      case 'ELEVATION':
        return `${Math.round(value)} m`;
      case 'STREAK':
        return `${Math.round(value)} días`;
      default:
        return value.toString();
    }
  };

  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const completedGoals = goals.filter(g => g.status === 'COMPLETED');

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
                <h1 className="font-display text-xl">MIS METAS</h1>
                <p className="text-xs text-muted-foreground">
                  {activeGoals.length} meta{activeGoals.length !== 1 ? 's' : ''} activa{activeGoals.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Meta
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Active Goals */}
            {activeGoals.length === 0 && completedGoals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="font-display text-xl mb-2">Sin metas</h2>
                <p className="text-muted-foreground mb-6">
                  Crea tu primera meta para empezar a trackear tu progreso.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear mi primera meta
                </Button>
              </motion.div>
            ) : (
              <>
                {activeGoals.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="font-display text-lg">METAS ACTIVAS</h2>
                    <AnimatePresence mode="popLayout">
                      {activeGoals.map((goal, index) => {
                        const config = GOAL_TYPE_CONFIG[goal.type];
                        const Icon = config.icon;
                        
                        return (
                          <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card>
                              <CardContent className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${config.color}`}>
                                      <Icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <h3 className="font-display text-lg">{goal.title}</h3>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline" className="text-xs">
                                          {GOAL_PERIOD_LABELS[goal.period]}
                                        </Badge>
                                        <span>•</span>
                                        <span>{goal.daysRemaining} días restantes</span>
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteGoal(goal.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                {goal.description && (
                                  <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                                )}
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progreso</span>
                                    <span className="font-medium">
                                      {formatValue(goal.currentValue, goal.type)} / {formatValue(goal.targetValue, goal.type)}
                                    </span>
                                  </div>
                                  <Progress value={goal.progressPercent} className="h-3" />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{goal.progressPercent}% completado</span>
                                    <span>
                                      Faltan {formatValue(Math.max(0, goal.targetValue - goal.currentValue), goal.type)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        METAS COMPLETADAS
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                      >
                        {showCompletedGoals ? 'Ocultar' : `Ver todas (${completedGoals.length})`}
                      </Button>
                    </div>
                    
                    {showCompletedGoals && (
                      <AnimatePresence mode="popLayout">
                        {completedGoals.map((goal, index) => {
                          const config = GOAL_TYPE_CONFIG[goal.type];
                          const Icon = config.icon;
                          
                          return (
                            <motion.div
                              key={goal.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className="opacity-75">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                    <div className="flex-1">
                                      <h3 className="font-medium">{goal.title}</h3>
                                      <p className="text-xs text-muted-foreground">
                                        {formatValue(goal.targetValue, goal.type)} • Completada el{' '}
                                        {goal.completedAt && new Date(goal.completedAt).toLocaleDateString('es-ES')}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Create Goal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Meta</DialogTitle>
            <DialogDescription>
              Define una meta para trackear tu progreso.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tipo de meta</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as GoalType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_TYPE_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <config.icon className={`w-4 h-4 ${config.color}`} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Período</Label>
              <Select
                value={formData.period}
                onValueChange={(value) => setFormData(prev => ({ ...prev, period: value as GoalPeriod }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GOAL_PERIOD_LABELS).map(([period, label]) => (
                    <SelectItem key={period} value={period}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Título</Label>
              <Input
                placeholder={`Ej: Correr 100 km este mes`}
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Objetivo ({GOAL_TYPE_CONFIG[formData.type].unit})</Label>
              <Input
                type="number"
                placeholder="100"
                value={formData.targetValue}
                onChange={(e) => setFormData(prev => ({ ...prev, targetValue: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                placeholder="Describe tu meta..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Crear Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
