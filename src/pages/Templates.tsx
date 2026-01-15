import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Loader2,
  FileText,
  Calendar,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  Users,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { planService } from '@/services/plan.service';
import { athleteService } from '@/services/athlete.service';
import { RunnioLogo } from '@/components/ui/RunnioLogo';
import type { TrainingPlan } from '@/types/plan';

export default function Templates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<TrainingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [athletes, setAthletes] = useState<{ id: string; name: string }[]>([]);
  
  // Dialog states
  const [editDialog, setEditDialog] = useState<{ open: boolean; template: TrainingPlan | null }>({ open: false, template: null });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: TrainingPlan | null }>({ open: false, template: null });
  const [createPlanDialog, setCreatePlanDialog] = useState<{ open: boolean; template: TrainingPlan | null }>({ open: false, template: null });
  
  // Form states
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [createPlanForm, setCreatePlanForm] = useState({ athleteId: '', planName: '', startDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTemplates();
    loadAthletes();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await planService.getTemplates();
      setTemplates(response.templates);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las plantillas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAthletes = async () => {
    try {
      const response = await athleteService.getMyAthletes();
      setAthletes(response.athletes.map(a => ({ id: a.id, name: a.name })));
    } catch (error) {
      console.error('Error loading athletes:', error);
    }
  };

  const handleEditTemplate = async () => {
    if (!editDialog.template) return;
    
    setIsSubmitting(true);
    try {
      await planService.updateTemplate(editDialog.template.id, editForm);
      toast({
        title: 'Plantilla actualizada',
        description: 'Los cambios se han guardado correctamente',
      });
      setEditDialog({ open: false, template: null });
      loadTemplates();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar la plantilla',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteDialog.template) return;
    
    setIsSubmitting(true);
    try {
      await planService.deleteTemplate(deleteDialog.template.id);
      toast({
        title: 'Plantilla eliminada',
        description: 'La plantilla ha sido eliminada correctamente',
      });
      setDeleteDialog({ open: false, template: null });
      loadTemplates();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la plantilla',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePlanFromTemplate = async () => {
    if (!createPlanDialog.template || !createPlanForm.athleteId || !createPlanForm.startDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un atleta y una fecha de inicio',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await planService.createPlanFromTemplate(createPlanDialog.template.id, {
        athleteId: createPlanForm.athleteId,
        planName: createPlanForm.planName || undefined,
        startDate: createPlanForm.startDate,
      });
      toast({
        title: 'Plan creado',
        description: 'El plan se ha creado correctamente desde la plantilla',
      });
      setCreatePlanDialog({ open: false, template: null });
      navigate(`/coach/plans/${response.plan.id}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el plan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (template: TrainingPlan) => {
    setEditForm({ name: template.name, description: template.description || '' });
    setEditDialog({ open: true, template });
  };

  const openCreatePlanDialog = (template: TrainingPlan) => {
    setCreatePlanForm({ athleteId: '', planName: '', startDate: new Date().toISOString().split('T')[0] });
    setCreatePlanDialog({ open: true, template });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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
                <h1 className="font-display text-xl">PLANTILLAS</h1>
                <p className="text-xs text-muted-foreground">
                  {templates.length} plantilla{templates.length !== 1 ? 's' : ''} guardada{templates.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="font-display text-xl mb-2">No tienes plantillas</h2>
            <p className="text-muted-foreground mb-6">
              Crea una plantilla desde cualquier plan existente para reutilizarla con otros atletas.
            </p>
            <Button onClick={() => navigate('/coach/plans')}>
              <FileText className="w-4 h-4 mr-2" />
              Ver mis planes
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {templates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              Plantilla
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {template._count?.sessions || template.sessions?.length || 0} sesiones
                            </Badge>
                          </div>
                          
                          <h3 className="font-display text-lg mb-1">{template.name}</h3>
                          
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {template.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Creada {formatDate(template.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openCreatePlanDialog(template)}>
                              <Users className="w-4 h-4 mr-2" />
                              Crear plan para atleta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(template)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar plantilla
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteDialog({ open: true, template })}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {/* Quick action button */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => openCreatePlanDialog(template)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Usar esta plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Edit Template Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open: false, template: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plantilla</DialogTitle>
            <DialogDescription>
              Modifica el nombre y descripción de la plantilla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre de la plantilla"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false, template: null })}>
              Cancelar
            </Button>
            <Button onClick={handleEditTemplate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, template: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Plantilla</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la plantilla "{deleteDialog.template?.name}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, template: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Plan from Template Dialog */}
      <Dialog open={createPlanDialog.open} onOpenChange={(open) => !open && setCreatePlanDialog({ open: false, template: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Plan desde Plantilla</DialogTitle>
            <DialogDescription>
              Usa la plantilla "{createPlanDialog.template?.name}" para crear un nuevo plan de entrenamiento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="athlete-select">Atleta</Label>
              <Select
                value={createPlanForm.athleteId}
                onValueChange={(value) => setCreatePlanForm(prev => ({ ...prev, athleteId: value }))}
              >
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
            <div>
              <Label htmlFor="plan-name">Nombre del plan (opcional)</Label>
              <Input
                id="plan-name"
                value={createPlanForm.planName}
                onChange={(e) => setCreatePlanForm(prev => ({ ...prev, planName: e.target.value }))}
                placeholder={createPlanDialog.template?.name.replace('Plantilla: ', '')}
              />
            </div>
            <div>
              <Label htmlFor="start-date">Fecha de inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={createPlanForm.startDate}
                onChange={(e) => setCreatePlanForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePlanDialog({ open: false, template: null })}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePlanFromTemplate} disabled={isSubmitting || !createPlanForm.athleteId || !createPlanForm.startDate}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Crear Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
