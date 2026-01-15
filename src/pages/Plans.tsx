import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  Users,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { planService } from '@/services/plan.service';
import { 
  TrainingPlan, 
  PLAN_STATUS_LABELS, 
  PLAN_STATUS_COLORS,
  SESSION_TYPE_LABELS,
} from '@/types/plan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { RunnioLogo } from '@/components/ui/RunnioLogo';

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const isCoach = user?.role === 'COACH';
  const basePath = isCoach ? '/coach/plans' : '/plans';

  useEffect(() => {
    loadPlans();
  }, [statusFilter]);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const response = await planService.getPlans(undefined, status);
      setPlans(response.plans);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los planes',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    try {
      await planService.deletePlan(planToDelete);
      setPlans(plans.filter(p => p.id !== planToDelete));
      toast({
        title: 'Plan eliminado',
        description: 'El plan ha sido eliminado correctamente',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el plan',
      });
    } finally {
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    try {
      await planService.updatePlan(planId, { status: newStatus as any });
      setPlans(plans.map(p => 
        p.id === planId ? { ...p, status: newStatus as any } : p
      ));
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

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.athlete.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getCompletionRate = (plan: TrainingPlan) => {
    const total = plan.sessions?.length || plan._count?.sessions || 0;
    if (total === 0) return 0;
    const completed = plan.sessions?.filter(s => s.completed).length || 0;
    return Math.round((completed / total) * 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

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
              <RunnioLogo size="sm" />
              <div>
                <h1 className="font-display text-xl">PLANES DE ENTRENAMIENTO</h1>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'COACH' ? 'Gestiona los planes de tus atletas' : 'Mis planes asignados'}
                </p>
              </div>
            </div>
            {isCoach && (
              <Button onClick={() => navigate(`${basePath}/new`)} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Plan
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o atleta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-4" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay planes</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'No se encontraron planes con esos criterios' 
                : 'Crea tu primer plan de entrenamiento'}
            </p>
            {user?.role === 'COACH' && !searchQuery && (
              <Button onClick={() => navigate(`${basePath}/new`)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Plan
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan, index) => {
              const completionRate = getCompletionRate(plan);
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => navigate(`${basePath}/${plan.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg truncate group-hover:text-primary transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {plan.description || 'Sin descripción'}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${basePath}/${plan.id}`);
                        }}>
                          <Edit className="w-4 h-4 mr-2" />
                          Ver/Editar
                        </DropdownMenuItem>
                        {isCoach && (
                          <>
                            <DropdownMenuSeparator />
                            {plan.status === 'DRAFT' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(plan.id, 'ACTIVE');
                              }}>
                                <Play className="w-4 h-4 mr-2" />
                                Activar
                              </DropdownMenuItem>
                            )}
                            {plan.status === 'ACTIVE' && (
                              <>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(plan.id, 'COMPLETED');
                                }}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marcar completado
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(plan.id, 'DRAFT');
                                }}>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pausar (Borrador)
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlanToDelete(plan.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Athlete Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={plan.athlete.avatar} />
                      <AvatarFallback className="text-xs">
                        {plan.athlete.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{plan.athlete.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                      </p>
                    </div>
                    <Badge className={`${PLAN_STATUS_COLORS[plan.status]} text-white text-xs`}>
                      {PLAN_STATUS_LABELS[plan.status]}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{plan._count?.sessions || plan.sessions?.length || 0} sesiones</span>
                      {plan.sessions && plan.sessions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Próxima: {plan.sessions[0]?.title}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
    </div>
  );
}
