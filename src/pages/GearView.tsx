import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  MoreVertical,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  gearService, 
  Gear, 
  GearType, 
  CreateGearData, 
  GEAR_TYPE_CONFIG,
  GEAR_STATUS_LABELS,
} from '@/services/gear.service';
import { RunnioLogo } from '@/components/ui/RunnioLogo';

export default function GearView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [gear, setGear] = useState<Gear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedGear, setSelectedGear] = useState<Gear | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  
  // Form state
  const [formData, setFormData] = useState<CreateGearData>({
    type: 'SHOES',
    brand: '',
    model: '',
    name: '',
    maxDistance: undefined,
    purchaseDate: '',
    notes: '',
  });

  useEffect(() => {
    loadGear();
  }, []);

  const loadGear = async () => {
    try {
      setIsLoading(true);
      const response = await gearService.getGear();
      setGear(response.gear);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el equipamiento',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.brand.trim() || !formData.model.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Marca y modelo son requeridos',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await gearService.createGear(formData);
      toast({
        title: 'Equipamiento creado',
        description: `${formData.brand} ${formData.model} agregado`,
      });
      setShowCreateDialog(false);
      resetForm();
      loadGear();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el equipamiento',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedGear) return;

    setIsSubmitting(true);
    try {
      await gearService.updateGear(selectedGear.id, {
        brand: formData.brand,
        model: formData.model,
        name: formData.name || null,
        maxDistance: formData.maxDistance || null,
        purchaseDate: formData.purchaseDate || null,
        notes: formData.notes || null,
      });
      toast({
        title: 'Equipamiento actualizado',
        description: 'Los cambios han sido guardados',
      });
      setShowEditDialog(false);
      loadGear();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el equipamiento',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetire = async (g: Gear) => {
    try {
      await gearService.updateGear(g.id, { status: 'RETIRED' });
      toast({
        title: 'Equipamiento retirado',
        description: `${g.brand} ${g.model} ha sido retirado`,
      });
      loadGear();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo retirar el equipamiento',
      });
    }
  };

  const handleReactivate = async (g: Gear) => {
    try {
      await gearService.updateGear(g.id, { status: 'ACTIVE' });
      toast({
        title: 'Equipamiento reactivado',
        description: `${g.brand} ${g.model} está activo de nuevo`,
      });
      loadGear();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo reactivar el equipamiento',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedGear) return;

    try {
      await gearService.deleteGear(selectedGear.id);
      toast({
        title: 'Equipamiento eliminado',
        description: `${selectedGear.brand} ${selectedGear.model} ha sido eliminado`,
      });
      setShowDeleteDialog(false);
      setSelectedGear(null);
      loadGear();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el equipamiento',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'SHOES',
      brand: '',
      model: '',
      name: '',
      maxDistance: undefined,
      purchaseDate: '',
      notes: '',
    });
  };

  const openEditDialog = (g: Gear) => {
    setSelectedGear(g);
    setFormData({
      type: g.type,
      brand: g.brand,
      model: g.model,
      name: g.name || '',
      maxDistance: g.maxDistanceKm || undefined,
      purchaseDate: g.purchaseDate?.split('T')[0] || '',
      notes: g.notes || '',
    });
    setShowEditDialog(true);
  };

  const activeGear = gear.filter(g => g.status === 'ACTIVE');
  const retiredGear = gear.filter(g => g.status === 'RETIRED');
  const alertGear = activeGear.filter(g => g.needsReplacement);

  const GearCard = ({ g, showActions = true }: { g: Gear; showActions?: boolean }) => {
    const config = GEAR_TYPE_CONFIG[g.type];
    
    return (
      <Card className={g.needsReplacement ? 'border-destructive/50' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{config.icon}</div>
              <div>
                <h3 className="font-display">
                  {g.name || `${g.brand} ${g.model}`}
                </h3>
                {g.name && (
                  <p className="text-sm text-muted-foreground">{g.brand} {g.model}</p>
                )}
                <Badge variant="outline" className="text-xs mt-1">
                  {config.label}
                </Badge>
              </div>
            </div>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditDialog(g)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  {g.status === 'ACTIVE' ? (
                    <DropdownMenuItem onClick={() => handleRetire(g)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Retirar
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => handleReactivate(g)}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Reactivar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => {
                      setSelectedGear(g);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Distancia</span>
              <span className="font-mono">
                {g.totalDistanceKm.toFixed(1)} km
                {g.maxDistanceKm && ` / ${g.maxDistanceKm} km`}
              </span>
            </div>
            
            {g.maxDistanceKm && (
              <div className="space-y-1">
                <Progress 
                  value={g.usagePercent || 0} 
                  className={`h-2 ${g.needsReplacement ? '[&>div]:bg-destructive' : ''}`}
                />
                <div className="flex justify-between text-xs">
                  <span className={g.needsReplacement ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                    {g.usagePercent}% usado
                  </span>
                  {g.needsReplacement && (
                    <span className="text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Necesita reemplazo
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between text-xs text-muted-foreground pt-2">
              <span>{g._count?.activities || g.totalActivities} actividades</span>
              {g.purchaseDate && (
                <span>Desde {new Date(g.purchaseDate).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
              <RunnioLogo size="sm" showText={false} />
              <div>
                <h1 className="font-display text-xl">MI EQUIPAMIENTO</h1>
                <p className="text-xs text-muted-foreground">
                  {activeGear.length} activo{activeGear.length !== 1 ? 's' : ''}
                  {alertGear.length > 0 && ` • ${alertGear.length} alerta${alertGear.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : gear.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">👟</div>
            <h2 className="font-display text-xl mb-2">Sin equipamiento</h2>
            <p className="text-muted-foreground mb-6">
              Agrega tus zapatillas, relojes y más para trackear su uso.
            </p>
            <Button onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar mi primer equipo
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Alerts */}
            {alertGear.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Equipamiento que necesita reemplazo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {alertGear.map(g => (
                        <div key={g.id} className="flex items-center justify-between p-2 rounded bg-background">
                          <div className="flex items-center gap-2">
                            <span>{GEAR_TYPE_CONFIG[g.type].icon}</span>
                            <span className="font-medium">{g.name || `${g.brand} ${g.model}`}</span>
                          </div>
                          <Badge variant="destructive">
                            {g.totalDistanceKm.toFixed(0)} / {g.maxDistanceKm} km
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Activo ({activeGear.length})
                </TabsTrigger>
                <TabsTrigger value="retired">
                  Retirado ({retiredGear.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4 mt-4">
                <AnimatePresence mode="popLayout">
                  {activeGear.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No tienes equipamiento activo
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeGear.map((g, i) => (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <GearCard g={g} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="retired" className="space-y-4 mt-4">
                <AnimatePresence mode="popLayout">
                  {retiredGear.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No tienes equipamiento retirado
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {retiredGear.map((g, i) => (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.05 }}
                          className="opacity-60"
                        >
                          <GearCard g={g} />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Equipamiento</DialogTitle>
            <DialogDescription>
              Registra un nuevo equipo para trackear su uso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as GearType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GEAR_TYPE_CONFIG).map(([type, config]) => (
                    <SelectItem key={type} value={type}>
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marca *</Label>
                <Input
                  placeholder="Nike, Garmin..."
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>
              <div>
                <Label>Modelo *</Label>
                <Input
                  placeholder="Pegasus 40, Forerunner 265..."
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Nombre personalizado</Label>
              <Input
                placeholder="Ej: Mis Pegasus azules"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Límite de km (opcional)</Label>
                <Input
                  type="number"
                  placeholder="800"
                  value={formData.maxDistance || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxDistance: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Te avisaremos cuando supere este límite
                </p>
              </div>
              <div>
                <Label>Fecha de compra</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                placeholder="Notas adicionales..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Equipamiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marca</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Nombre personalizado</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Límite de km</Label>
                <Input
                  type="number"
                  value={formData.maxDistance || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    maxDistance: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                />
              </div>
              <div>
                <Label>Fecha de compra</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar equipamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará {selectedGear?.brand} {selectedGear?.model} y todo su historial de uso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
