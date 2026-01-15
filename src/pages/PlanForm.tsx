import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { planService } from '@/services/plan.service';
import { athleteService } from '@/services/athlete.service';
import { 
  TrainingPlan, 
  CreatePlanData, 
  CreateSessionData,
  SessionType,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
  PlanStatus,
} from '@/types/plan';
import { Athlete } from '@/types/athlete';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { RunnioLogo } from '@/components/ui/RunnioLogo';

interface SessionFormData extends CreateSessionData {
  id?: string;
  isOpen?: boolean;
}

export default function PlanForm() {
  const { planId } = useParams();
  const isEditing = Boolean(planId);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const isCoach = user?.role === 'COACH';
  const basePath = isCoach ? '/coach/plans' : '/plans';

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [athleteId, setAthleteId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sessions, setSessions] = useState<SessionFormData[]>([]);

  useEffect(() => {
    loadAthletes();
    if (isEditing && planId) {
      loadPlan(planId);
    }
  }, [planId]);

  const loadAthletes = async () => {
    try {
      const response = await athleteService.getAthletes();
      setAthletes(response.athletes);
    } catch (error) {
      console.error('Error loading athletes:', error);
    }
  };

  const loadPlan = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await planService.getPlan(id);
      const plan = response.plan;
      
      setName(plan.name);
      setDescription(plan.description || '');
      setAthleteId(plan.athleteId);
      setStartDate(plan.startDate.split('T')[0]);
      setEndDate(plan.endDate.split('T')[0]);
      setSessions(plan.sessions.map(s => ({
        ...s,
        date: s.date.split('T')[0],
        isOpen: false,
      })));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el plan',
      });
      navigate(basePath);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!athleteId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes seleccionar un atleta',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const planData: CreatePlanData = {
        athleteId,
        name,
        description: description || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        sessions: sessions.map(s => ({
          date: new Date(s.date).toISOString(),
          sessionType: s.sessionType,
          title: s.title,
          description: s.description,
          targetDistance: s.targetDistance,
          targetDuration: s.targetDuration,
          targetPace: s.targetPace,
          warmup: s.warmup,
          mainWorkout: s.mainWorkout,
          cooldown: s.cooldown,
        })),
      };

      if (isEditing && planId) {
        // Para editar, actualizamos el plan y las sesiones por separado
        await planService.updatePlan(planId, { name, description });
        // TODO: Actualizar sesiones individualmente
        toast({
          title: 'Plan actualizado',
          description: 'El plan ha sido actualizado correctamente',
        });
      } else {
        await planService.createPlan(planData);
        toast({
          title: 'Plan creado',
          description: 'El plan ha sido creado correctamente',
        });
      }
      
      navigate(basePath);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} el plan`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSession = () => {
    const newSession: SessionFormData = {
      date: startDate || new Date().toISOString().split('T')[0],
      sessionType: 'EASY',
      title: '',
      description: '',
      isOpen: true,
    };
    setSessions([...sessions, newSession]);
  };

  const updateSession = (index: number, updates: Partial<SessionFormData>) => {
    const updated = [...sessions];
    updated[index] = { ...updated[index], ...updates };
    setSessions(updated);
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const toggleSessionOpen = (index: number) => {
    const updated = [...sessions];
    updated[index].isOpen = !updated[index].isOpen;
    setSessions(updated);
  };

  const generateWeeklySessions = () => {
    if (!startDate || !endDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona las fechas de inicio y fin primero',
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const newSessions: SessionFormData[] = [];
    
    // Template semanal típico
    const weekTemplate: { day: number; type: SessionType; title: string }[] = [
      { day: 1, type: 'EASY', title: 'Carrera fácil' },
      { day: 2, type: 'REST', title: 'Descanso' },
      { day: 3, type: 'INTERVALS', title: 'Series' },
      { day: 4, type: 'EASY', title: 'Carrera fácil' },
      { day: 5, type: 'REST', title: 'Descanso' },
      { day: 6, type: 'TEMPO', title: 'Tempo' },
      { day: 0, type: 'LONG_RUN', title: 'Fondo' },
    ];

    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      const template = weekTemplate.find(t => t.day === dayOfWeek);
      
      if (template) {
        newSessions.push({
          date: current.toISOString().split('T')[0],
          sessionType: template.type,
          title: template.title,
          description: '',
          isOpen: false,
        });
      }
      
      current.setDate(current.getDate() + 1);
    }

    setSessions(newSessions);
    toast({
      title: 'Sesiones generadas',
      description: `Se han generado ${newSessions.length} sesiones`,
    });
  };

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
              <Button variant="ghost" size="icon" onClick={() => navigate(basePath)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <RunnioLogo size="sm" />
              <div>
                <h1 className="font-display text-xl">
                  {isEditing ? 'EDITAR PLAN' : 'NUEVO PLAN'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {isEditing ? 'Modifica el plan de entrenamiento' : 'Crea un nuevo plan de entrenamiento'}
                </p>
              </div>
            </div>
            <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plan Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Plan</CardTitle>
              <CardDescription>Datos básicos del plan de entrenamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Plan *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Preparación Media Maratón"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="athlete">Atleta *</Label>
                  <Select value={athleteId} onValueChange={setAthleteId} disabled={isEditing}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un atleta" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={athlete.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={athlete.avatar} />
                              <AvatarFallback className="text-xs">
                                {athlete.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {athlete.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el objetivo del plan..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sesiones de Entrenamiento</CardTitle>
                  <CardDescription>
                    {sessions.length} sesiones programadas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateWeeklySessions}
                    disabled={!startDate || !endDate}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Generar Semanas
                  </Button>
                  <Button type="button" variant="outline" onClick={addSession}>
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay sesiones programadas</p>
                  <p className="text-sm">Agrega sesiones manualmente o genera un plan semanal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <Collapsible
                      key={index}
                      open={session.isOpen}
                      onOpenChange={() => toggleSessionOpen(index)}
                    >
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 flex items-center gap-3">
                              <Badge className={`${SESSION_TYPE_COLORS[session.sessionType]} text-white text-xs`}>
                                {SESSION_TYPE_LABELS[session.sessionType]}
                              </Badge>
                              <span className="text-sm font-medium">
                                {session.title || 'Sin título'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {session.date ? new Date(session.date).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                }) : 'Sin fecha'}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSession(index);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                            {session.isOpen ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input
                                  type="date"
                                  value={session.date}
                                  onChange={(e) => updateSession(index, { date: e.target.value })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Tipo de Sesión</Label>
                                <Select 
                                  value={session.sessionType} 
                                  onValueChange={(v) => updateSession(index, { sessionType: v as SessionType })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Título</Label>
                                <Input
                                  value={session.title}
                                  onChange={(e) => updateSession(index, { title: e.target.value })}
                                  placeholder="Ej: Fondo largo"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Descripción</Label>
                              <Textarea
                                value={session.description || ''}
                                onChange={(e) => updateSession(index, { description: e.target.value })}
                                placeholder="Describe la sesión..."
                                rows={2}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Distancia objetivo (km)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={session.targetDistance || ''}
                                  onChange={(e) => updateSession(index, { 
                                    targetDistance: e.target.value ? parseFloat(e.target.value) : undefined 
                                  })}
                                  placeholder="10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Duración objetivo (min)</Label>
                                <Input
                                  type="number"
                                  value={session.targetDuration ? Math.round(session.targetDuration / 60) : ''}
                                  onChange={(e) => updateSession(index, { 
                                    targetDuration: e.target.value ? parseInt(e.target.value) * 60 : undefined 
                                  })}
                                  placeholder="60"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Ritmo objetivo (min/km)</Label>
                                <Input
                                  type="text"
                                  value={session.targetPace ? `${Math.floor(session.targetPace / 60)}:${String(Math.round(session.targetPace % 60)).padStart(2, '0')}` : ''}
                                  onChange={(e) => {
                                    const parts = e.target.value.split(':');
                                    if (parts.length === 2) {
                                      const mins = parseInt(parts[0]) || 0;
                                      const secs = parseInt(parts[1]) || 0;
                                      updateSession(index, { targetPace: mins * 60 + secs });
                                    }
                                  }}
                                  placeholder="5:30"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label>Calentamiento</Label>
                                <Textarea
                                  value={session.warmup || ''}
                                  onChange={(e) => updateSession(index, { warmup: e.target.value })}
                                  placeholder="15' trote suave"
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Parte Principal</Label>
                                <Textarea
                                  value={session.mainWorkout || ''}
                                  onChange={(e) => updateSession(index, { mainWorkout: e.target.value })}
                                  placeholder="8x1000m a 4:00/km"
                                  rows={2}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Vuelta a la calma</Label>
                                <Textarea
                                  value={session.cooldown || ''}
                                  onChange={(e) => updateSession(index, { cooldown: e.target.value })}
                                  placeholder="10' trote + estiramientos"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
