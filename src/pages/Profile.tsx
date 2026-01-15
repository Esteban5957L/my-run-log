import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  MapPin,
  Scale,
  Ruler,
  Heart,
  Activity,
  Award,
  Mountain,
  Clock,
  Edit,
  Save,
  X,
  Loader2,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { profileService, UserProfile, UpdateProfileData } from '@/services/profile.service';
import { RunnioLogo } from '@/components/ui/RunnioLogo';

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHRDialog, setShowHRDialog] = useState(false);
  const [hrMax, setHrMax] = useState('');
  const [hrRest, setHrRest] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<UpdateProfileData>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await profileService.getProfile();
      setProfile(response.profile);
      setFormData({
        name: response.profile.name,
        bio: response.profile.bio,
        location: response.profile.location,
        birthDate: response.profile.birthDate?.split('T')[0] || null,
        gender: response.profile.gender,
        weight: response.profile.weight,
        height: response.profile.height,
      });
      setHrMax(response.profile.hrMax?.toString() || '');
      setHrRest(response.profile.hrRest?.toString() || '');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el perfil',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await profileService.updateProfile(formData);
      setProfile(prev => prev ? { ...prev, ...response.profile } : null);
      setIsEditing(false);
      toast({
        title: 'Perfil actualizado',
        description: 'Tus cambios han sido guardados',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el perfil',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCalculateHRZones = async () => {
    if (!hrMax || parseInt(hrMax) < 100 || parseInt(hrMax) > 250) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'FC máxima debe estar entre 100 y 250',
      });
      return;
    }

    try {
      const response = await profileService.calculateHRZones(
        parseInt(hrMax),
        hrRest ? parseInt(hrRest) : undefined
      );
      setProfile(prev => prev ? {
        ...prev,
        ...response.zones,
      } : null);
      setShowHRDialog(false);
      toast({
        title: 'Zonas calculadas',
        description: 'Tus zonas de FC han sido actualizadas',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron calcular las zonas',
      });
    }
  };

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const formatDistance = (meters: number) => {
    if (meters >= 1000000) return `${(meters / 1000).toFixed(0)} km`;
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(seconds / 60)}m`;
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Error al cargar perfil</p>
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
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <RunnioLogo size="sm" showText={false} />
              <div>
                <h1 className="font-display text-xl">MI PERFIL</h1>
                <p className="text-xs text-muted-foreground">Datos personales y configuración</p>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-trail text-primary-foreground text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  {isEditing ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-display mb-2"
                    />
                  ) : (
                    <h2 className="text-2xl font-display">{profile.name}</h2>
                  )}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                    <Badge variant="secondary">{profile.role === 'COACH' ? 'Entrenador' : 'Atleta'}</Badge>
                    {profile.stravaConnected && (
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        Strava conectado
                      </Badge>
                    )}
                    {profile.coach && (
                      <Badge variant="outline">
                        Coach: {profile.coach.name}
                      </Badge>
                    )}
                  </div>
                  {isEditing ? (
                    <Textarea
                      placeholder="Escribe algo sobre ti..."
                      value={formData.bio || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="mt-3"
                      rows={2}
                    />
                  ) : profile.bio ? (
                    <p className="text-muted-foreground mt-3">{profile.bio}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-display">{formatDistance(profile.totalStats.distance)}</p>
              <p className="text-xs text-muted-foreground">Distancia total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-energy" />
              <p className="text-2xl font-display">{formatDuration(profile.totalStats.duration)}</p>
              <p className="text-xs text-muted-foreground">Tiempo total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Mountain className="w-6 h-6 mx-auto mb-2 text-summit" />
              <p className="text-2xl font-display">{profile.totalStats.elevation.toLocaleString()}m</p>
              <p className="text-xs text-muted-foreground">Desnivel +</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-trail" />
              <p className="text-2xl font-display">{profile.totalStats.activities}</p>
              <p className="text-xs text-muted-foreground">Actividades</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground text-xs">Ubicación</Label>
                  {isEditing ? (
                    <Input
                      placeholder="Ciudad, País"
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.location || '-'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Fecha de nacimiento</Label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {profile.birthDate 
                          ? `${new Date(profile.birthDate).toLocaleDateString('es-ES')} (${calculateAge(profile.birthDate)} años)`
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Género</Label>
                  {isEditing ? (
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        gender: value as 'MALE' | 'FEMALE' | 'OTHER' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Masculino</SelectItem>
                        <SelectItem value="FEMALE">Femenino</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">
                      {profile.gender === 'MALE' ? 'Masculino' : 
                       profile.gender === 'FEMALE' ? 'Femenino' : 
                       profile.gender === 'OTHER' ? 'Otro' : '-'}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Peso (kg)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      placeholder="70"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        weight: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Scale className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.weight ? `${profile.weight} kg` : '-'}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Altura (cm)</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      placeholder="175"
                      value={formData.height || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        height: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.height ? `${profile.height} cm` : '-'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* HR Zones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Zonas de Frecuencia Cardíaca
                  </CardTitle>
                  <CardDescription>
                    Configura tus zonas para análisis de entrenamiento
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowHRDialog(true)}>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profile.hrMax ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>FC Máxima</span>
                    <span className="font-mono">{profile.hrMax} bpm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>FC Reposo</span>
                    <span className="font-mono">{profile.hrRest || '-'} bpm</span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-blue-500/20">
                      <p className="font-medium text-blue-500">Z1</p>
                      <p className="text-muted-foreground">Recuperación</p>
                      <p className="font-mono">&lt;{profile.hrZone1}</p>
                    </div>
                    <div className="p-2 rounded bg-green-500/20">
                      <p className="font-medium text-green-500">Z2</p>
                      <p className="text-muted-foreground">Aeróbico</p>
                      <p className="font-mono">{profile.hrZone1}-{profile.hrZone2}</p>
                    </div>
                    <div className="p-2 rounded bg-yellow-500/20">
                      <p className="font-medium text-yellow-500">Z3</p>
                      <p className="text-muted-foreground">Tempo</p>
                      <p className="font-mono">{profile.hrZone2}-{profile.hrZone3}</p>
                    </div>
                    <div className="p-2 rounded bg-orange-500/20">
                      <p className="font-medium text-orange-500">Z4</p>
                      <p className="text-muted-foreground">Umbral</p>
                      <p className="font-mono">{profile.hrZone3}-{profile.hrZone4}</p>
                    </div>
                    <div className="p-2 rounded bg-red-500/20">
                      <p className="font-medium text-red-500">Z5</p>
                      <p className="text-muted-foreground">VO2max</p>
                      <p className="font-mono">&gt;{profile.hrZone4}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-3">
                    No tienes zonas de FC configuradas
                  </p>
                  <Button variant="outline" onClick={() => setShowHRDialog(true)}>
                    Configurar zonas
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Member since */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-muted-foreground"
        >
          Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-ES', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </motion.div>
      </main>

      {/* HR Zones Dialog */}
      <Dialog open={showHRDialog} onOpenChange={setShowHRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calcular Zonas de FC</DialogTitle>
            <DialogDescription>
              Ingresa tu frecuencia cardíaca máxima para calcular tus zonas de entrenamiento usando la fórmula de Karvonen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>FC Máxima (bpm) *</Label>
              <Input
                type="number"
                placeholder="Ej: 185"
                value={hrMax}
                onChange={(e) => setHrMax(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fórmula estimada: 220 - edad = {user?.name ? 220 - 30 : '~190'} bpm
              </p>
            </div>
            <div>
              <Label>FC en Reposo (bpm)</Label>
              <Input
                type="number"
                placeholder="Ej: 60"
                value={hrRest}
                onChange={(e) => setHrRest(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Mide tu FC al despertar, antes de levantarte
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHRDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCalculateHRZones}>
              Calcular Zonas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
