import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Edit,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  Circle,
  SkipForward,
  ChevronRight,
  TrendingUp,
  Activity,
  User,
  Plus,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Copy,
  FileText,
  MessageSquare,
  Send,
  X,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { planService, PlanResponse } from '@/services/plan.service';
import { 
  TrainingPlan, 
  PlanSession,
  PLAN_STATUS_LABELS, 
  PLAN_STATUS_COLORS,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_COLORS,
} from '@/types/plan';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RunnioLogo } from '@/components/ui/RunnioLogo';
import { athleteService } from '@/services/athlete.service';
import { Athlete } from '@/types/athlete';

export default function PlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [stats, setStats] = useState<PlanResponse['stats'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Duplicar plan
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [duplicateTargetAthleteId, setDuplicateTargetAthleteId] = useState('');
  const [duplicateStartDate, setDuplicateStartDate] = useState('');
  const [duplicateNewName, setDuplicateNewName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  // Crear plantilla
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  
  // Feedback de sesión
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PlanSession | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  const isCoach = user?.role === 'COACH';
  const basePath = isCoach ? '/coach/plans' : '/plans';

  useEffect(() => {
    if (planId) {
      loadPlan(planId);
    }
  }, [planId]);

  const loadPlan = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await planService.getPlan(id);
      setPlan(response.plan);
      setStats(response.stats);
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

  const handleSessionStatusChange = async (sessionId: string, completed: boolean, skipped: boolean = false) => {
    try {
      await planService.updateSessionStatus(sessionId, { completed, skipped });
      
      // Actualizar el estado local
      if (plan) {
        const updatedSessions = plan.sessions.map(s => 
          s.id === sessionId ? { ...s, completed, skipped } : s
        );
        setPlan({ ...plan, sessions: updatedSessions });
        
        // Recalcular stats
        const completedCount = updatedSessions.filter(s => s.completed).length;
        const total = updatedSessions.length;
        setStats({
          completedSessions: completedCount,
          totalSessions: total,
          completionRate: total > 0 ? Math.round((completedCount / total) * 100) : 0,
        });
      }
      
      toast({
        title: completed ? 'Sesión completada' : skipped ? 'Sesión saltada' : 'Sesión pendiente',
        description: 'El estado de la sesión ha sido actualizado',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado',
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!plan) return;
    
    try {
      await planService.updatePlan(plan.id, { status: newStatus as any });
      setPlan({ ...plan, status: newStatus as any });
      toast({
        title: 'Estado actualizado',
        description: `El plan ahora está ${PLAN_STATUS_LABELS[newStatus as keyof typeof PLAN_STATUS_LABELS]}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado',
      });
    }
  };

  // Cargar atletas para duplicar
  const loadAthletes = async () => {
    try {
      const response = await athleteService.getMyAthletes();
      setAthletes(response.athletes);
    } catch (error) {
      console.error('Error loading athletes:', error);
    }
  };

  const openDuplicateDialog = () => {
    loadAthletes();
    setDuplicateNewName(plan?.name ? `${plan.name} (copia)` : '');
    setDuplicateStartDate(new Date().toISOString().split('T')[0]);
    setDuplicateTargetAthleteId('');
    setDuplicateDialogOpen(true);
  };

  const handleDuplicatePlan = async () => {
    if (!plan || !duplicateTargetAthleteId || !duplicateStartDate) return;
    
    setIsDuplicating(true);
    try {
      const result = await planService.duplicatePlan(plan.id, {
        targetAthleteId: duplicateTargetAthleteId,
        newName: duplicateNewName || undefined,
        startDate: new Date(duplicateStartDate).toISOString(),
      });
      
      toast({
        title: 'Plan duplicado',
        description: `El plan ha sido duplicado para ${result.plan.athlete?.name}`,
      });
      
      setDuplicateDialogOpen(false);
      navigate(`${basePath}/${result.plan.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo duplicar el plan',
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const openTemplateDialog = () => {
    setTemplateName(plan?.name ? `Plantilla: ${plan.name}` : '');
    setTemplateDialogOpen(true);
  };

  const handleCreateTemplate = async () => {
    if (!plan) return;
    
    setIsCreatingTemplate(true);
    try {
      await planService.createTemplate(plan.id, templateName || undefined);
      
      toast({
        title: 'Plantilla creada',
        description: 'La plantilla ha sido creada correctamente',
      });
      
      setTemplateDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la plantilla',
      });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const openFeedbackDialog = (session: PlanSession) => {
    setSelectedSession(session);
    setFeedbackText(session.coachFeedback || '');
    setNotesText(session.coachNotes || '');
    setFeedbackDialogOpen(true);
  };

  const handleSaveFeedback = async () => {
    if (!selectedSession) return;
    
    setIsSavingFeedback(true);
    try {
      await planService.addSessionFeedback(selectedSession.id, {
        coachFeedback: feedbackText || undefined,
        coachNotes: notesText || undefined,
      });
      
      // Actualizar estado local
      if (plan) {
        const updatedSessions = plan.sessions.map(s => 
          s.id === selectedSession.id 
            ? { ...s, coachFeedback: feedbackText, coachNotes: notesText } 
            : s
        );
        setPlan({ ...plan, sessions: updatedSessions });
      }
      
      toast({
        title: 'Feedback guardado',
        description: 'El comentario ha sido guardado correctamente',
      });
      
      setFeedbackDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el feedback',
      });
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!plan) return;
    
    try {
      await planService.deletePlan(plan.id);
      toast({
        title: 'Plan eliminado',
        description: 'El plan ha sido eliminado correctamente',
      });
      navigate(basePath);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el plan',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatShortDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatPace = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}/km`;
  };

  const groupSessionsByWeek = (sessions: PlanSession[]) => {
    const weeks: { weekStart: Date; sessions: PlanSession[] }[] = [];
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      const weekStart = new Date(sessionDate);
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const existingWeek = weeks.find(w => w.weekStart.getTime() === weekStart.getTime());
      if (existingWeek) {
        existingWeek.sessions.push(session);
      } else {
        weeks.push({ weekStart, sessions: [session] });
      }
    });
    
    return weeks.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-display mb-2">Plan no encontrado</h2>
          <Button onClick={() => navigate('/plans')}>Volver a Planes</Button>
        </div>
      </div>
    );
  }

  const weeks = groupSessionsByWeek(plan.sessions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
                <h1 className="font-display text-xl">{plan.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {formatShortDate(plan.startDate)} - {formatShortDate(plan.endDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${PLAN_STATUS_COLORS[plan.status]} text-white`}>
                {PLAN_STATUS_LABELS[plan.status]}
              </Badge>
              {isCoach && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`${basePath}/${plan.id}/edit`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openDuplicateDialog}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar a otro atleta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={openTemplateDialog}>
                      <FileText className="w-4 h-4 mr-2" />
                      Guardar como plantilla
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {plan.status === 'DRAFT' && (
                      <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')}>
                        <Play className="w-4 h-4 mr-2" />
                        Activar
                      </DropdownMenuItem>
                    )}
                    {plan.status === 'ACTIVE' && (
                      <>
                        <DropdownMenuItem onClick={() => handleStatusChange('COMPLETED')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar completado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange('DRAFT')}>
                          <Pause className="w-4 h-4 mr-2" />
                          Pausar
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <User className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Atleta</p>
              <p className="font-medium truncate">{plan.athlete.name}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Sesiones</p>
              <p className="font-medium">{stats?.totalSessions || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-500" />
              <p className="text-xs text-muted-foreground">Completadas</p>
              <p className="font-medium">{stats?.completedSessions || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-xs text-muted-foreground">Progreso</p>
              <p className="font-medium">{stats?.completionRate || 0}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progreso del Plan</span>
              <span className="text-sm text-muted-foreground">
                {stats?.completedSessions}/{stats?.totalSessions} sesiones
              </span>
            </div>
            <Progress value={stats?.completionRate || 0} className="h-3" />
          </CardContent>
        </Card>

        {/* Description */}
        {plan.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{plan.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Sessions by Week */}
        <div className="space-y-6">
          {weeks.map((week, weekIndex) => {
            const weekEnd = new Date(week.weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            return (
              <Card key={weekIndex}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Semana {weekIndex + 1}
                  </CardTitle>
                  <CardDescription>
                    {formatShortDate(week.weekStart.toISOString())} - {formatShortDate(weekEnd.toISOString())}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {week.sessions.map((session, sessionIndex) => {
                      const sessionDate = new Date(session.date);
                      sessionDate.setHours(0, 0, 0, 0);
                      const isPast = sessionDate < today;
                      const isToday = sessionDate.getTime() === today.getTime();
                      
                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sessionIndex * 0.05 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isToday ? 'border-primary bg-primary/5' : 
                            session.completed ? 'border-green-500/30 bg-green-500/5' :
                            session.skipped ? 'border-gray-500/30 bg-gray-500/5 opacity-60' :
                            'border-border'
                          }`}
                        >
                          {/* Status Toggle */}
                          <button
                            onClick={() => {
                              if (session.completed) {
                                handleSessionStatusChange(session.id, false, false);
                              } else if (session.skipped) {
                                handleSessionStatusChange(session.id, false, false);
                              } else {
                                handleSessionStatusChange(session.id, true, false);
                              }
                            }}
                            className="shrink-0"
                          >
                            {session.completed ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : session.skipped ? (
                              <SkipForward className="w-6 h-6 text-gray-500" />
                            ) : (
                              <Circle className="w-6 h-6 text-muted-foreground hover:text-primary transition-colors" />
                            )}
                          </button>

                          {/* Session Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`${SESSION_TYPE_COLORS[session.sessionType]} text-white text-xs`}>
                                {SESSION_TYPE_LABELS[session.sessionType]}
                              </Badge>
                              <span className={`font-medium ${session.completed || session.skipped ? 'line-through text-muted-foreground' : ''}`}>
                                {session.title}
                              </span>
                              {isToday && (
                                <Badge variant="outline" className="text-xs border-primary text-primary">
                                  Hoy
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDate(session.date)}</span>
                              {session.targetDistance && (
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {session.targetDistance} km
                                </span>
                              )}
                              {session.targetDuration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(session.targetDuration)}
                                </span>
                              )}
                              {session.targetPace && (
                                <span className="flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  {formatPace(session.targetPace)}
                                </span>
                              )}
                            </div>
                            {session.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {session.description}
                              </p>
                            )}
                          </div>

                          {/* Coach Feedback Button */}
                          {isCoach && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openFeedbackDialog(session)}
                              className={session.coachFeedback ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
                              title={session.coachFeedback ? 'Ver/editar feedback' : 'Agregar feedback'}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Skip Button (for non-completed sessions) */}
                          {!session.completed && !session.skipped && isPast && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSessionStatusChange(session.id, false, true)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <SkipForward className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Linked Activity */}
                          {session.activities && session.activities.length > 0 && (
                            <div className="text-right text-xs">
                              <p className="text-muted-foreground">Realizado:</p>
                              <p className="font-medium">
                                {session.activities[0].distance.toFixed(1)} km
                              </p>
                            </div>
                          )}
                          
                          {/* Coach Feedback Display (for athletes) */}
                          {!isCoach && session.coachFeedback && (
                            <div className="text-right text-xs max-w-[150px]">
                              <p className="text-primary font-medium">💬 Coach:</p>
                              <p className="text-muted-foreground line-clamp-2">
                                {session.coachFeedback}
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plan.sessions.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No hay sesiones programadas</p>
              {isCoach && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate(`${basePath}/${plan.id}/edit`)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Sesiones
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las sesiones asociadas a este plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePlan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Plan Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Plan</DialogTitle>
            <DialogDescription>
              Duplica este plan para asignarlo a otro atleta con una nueva fecha de inicio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetAthlete">Atleta destino</Label>
              <Select value={duplicateTargetAthleteId} onValueChange={setDuplicateTargetAthleteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un atleta" />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">Nombre del plan (opcional)</Label>
              <Input
                id="newName"
                value={duplicateNewName}
                onChange={(e) => setDuplicateNewName(e.target.value)}
                placeholder="Nombre del nuevo plan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={duplicateStartDate}
                onChange={(e) => setDuplicateStartDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDuplicatePlan} 
              disabled={!duplicateTargetAthleteId || !duplicateStartDate || isDuplicating}
            >
              {isDuplicating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Duplicando...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar como Plantilla</DialogTitle>
            <DialogDescription>
              Crea una plantilla reutilizable a partir de este plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Nombre de la plantilla</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nombre de la plantilla"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTemplate} disabled={isCreatingTemplate}>
              {isCreatingTemplate ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Crear Plantilla
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback de Sesión</DialogTitle>
            <DialogDescription>
              {selectedSession?.title} - {selectedSession && formatDate(selectedSession.date)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coachNotes">Notas internas (solo para ti)</Label>
              <Textarea
                id="coachNotes"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Notas privadas sobre esta sesión..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coachFeedback">Feedback para el atleta</Label>
              <Textarea
                id="coachFeedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Comentarios visibles para el atleta..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFeedback} disabled={isSavingFeedback}>
              {isSavingFeedback ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Guardar Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
