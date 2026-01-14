import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Activity, 
  MessageSquare, 
  Plus, 
  Search, 
  AlertCircle,
  TrendingUp,
  Clock,
  Mountain,
  Copy,
  Check,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { athleteService } from '@/services/athlete.service';
import { invitationService } from '@/services/invitation.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { RunnioLogo } from '@/components/ui/RunnioLogo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Athlete } from '@/types/athlete';

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1) + ' km';
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function CoachDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const { athletes } = await athleteService.getMyAthletes();
      setAthletes(athletes);
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

  const createInvitation = async () => {
    setIsCreatingInvite(true);
    try {
      const { invitation, inviteLink: link } = await invitationService.createInvitation();
      setInviteCode(invitation.code);
      setInviteLink(link);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo crear la invitación',
      });
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: '¡Copiado!',
      description: 'El código ha sido copiado al portapapeles',
    });
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStats = athletes.reduce(
    (acc, athlete) => ({
      distance: acc.distance + athlete.weeklyStats.distance,
      duration: acc.duration + athlete.weeklyStats.duration,
      elevation: acc.elevation + athlete.weeklyStats.elevation,
      workouts: acc.workouts + athlete.weeklyStats.workouts,
    }),
    { distance: 0, duration: 0, elevation: 0, workouts: 0 }
  );

  const inactiveAthletes = athletes.filter(
    a => a.daysSinceLastActivity !== null && a.daysSinceLastActivity > 7
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <RunnioLogo size="md" />
              <div>
                <h1 className="font-display text-xl">RUNN.IO</h1>
                <p className="text-sm text-muted-foreground">Panel del Entrenador</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => navigate('/coach/messages')}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                  3
                </span>
              </Button>
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="bg-gradient-trail text-primary-foreground">
                  {user?.name ? getInitials(user.name) : 'CO'}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout}
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="font-display text-3xl text-foreground mb-2">
            ¡Hola, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="text-muted-foreground">
            Aquí tienes un resumen de la actividad de tu equipo esta semana.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="font-display text-3xl text-foreground">{athletes.length}</div>
            <div className="text-sm text-muted-foreground">Atletas</div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-trail/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-trail" />
              </div>
            </div>
            <div className="font-display text-3xl text-foreground">{formatDistance(totalStats.distance)}</div>
            <div className="text-sm text-muted-foreground">Distancia semanal</div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-energy/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-energy" />
              </div>
            </div>
            <div className="font-display text-3xl text-foreground">{formatDuration(totalStats.duration)}</div>
            <div className="text-sm text-muted-foreground">Tiempo total</div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-summit/20 flex items-center justify-center">
                <Mountain className="w-5 h-5 text-summit" />
              </div>
            </div>
            <div className="font-display text-3xl text-foreground">{totalStats.elevation.toLocaleString()}m</div>
            <div className="text-sm text-muted-foreground">Desnivel +</div>
          </div>
        </motion.div>

        {/* Alerts */}
        {inactiveAthletes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {inactiveAthletes.length} atleta{inactiveAthletes.length > 1 ? 's' : ''} sin actividad en más de 7 días
                </p>
                <p className="text-sm text-muted-foreground">
                  {inactiveAthletes.map(a => a.name).join(', ')}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Athletes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl text-foreground">MIS ATLETAS</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar atleta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="hero" onClick={() => { setInviteDialogOpen(true); createInvitation(); }}>
                    <Plus className="w-4 h-4" />
                    Invitar Atleta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl">INVITAR ATLETA</DialogTitle>
                    <DialogDescription>
                      Comparte este código o enlace con tu atleta para que pueda unirse a tu equipo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {isCreatingInvite ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Código de invitación</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 font-mono text-2xl tracking-widest text-center py-3 bg-muted rounded-lg">
                              {inviteCode}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(inviteCode)}
                            >
                              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Enlace directo</label>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={inviteLink}
                              className="text-xs"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => copyToClipboard(inviteLink)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          El código expira en 7 días.
                        </p>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                    <div className="h-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAthletes.length === 0 ? (
            <div className="text-center py-16 glass rounded-xl">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h4 className="font-display text-xl text-foreground mb-2">
                {searchQuery ? 'Sin resultados' : 'Sin atletas'}
              </h4>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'No se encontraron atletas con ese nombre'
                  : 'Invita a tu primer atleta para comenzar'}
              </p>
              {!searchQuery && (
                <Button variant="hero" onClick={() => { setInviteDialogOpen(true); createInvitation(); }}>
                  <Plus className="w-4 h-4" />
                  Invitar Atleta
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAthletes.map((athlete, index) => (
                <motion.div
                  key={athlete.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/coach/athlete/${athlete.id}`}>
                    <div className="glass rounded-xl p-6 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={athlete.avatar || undefined} />
                          <AvatarFallback className="bg-gradient-trail text-primary-foreground text-lg">
                            {getInitials(athlete.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display text-lg text-foreground truncate group-hover:text-primary transition-colors">
                            {athlete.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            {athlete.stravaConnected && (
                              <Badge variant="secondary" className="text-xs">
                                Strava
                              </Badge>
                            )}
                            {athlete.daysSinceLastActivity !== null && athlete.daysSinceLastActivity > 7 && (
                              <Badge variant="destructive" className="text-xs">
                                Inactivo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="font-display text-lg text-foreground">
                            {formatDistance(athlete.weeklyStats.distance)}
                          </div>
                          <div className="text-xs text-muted-foreground">Distancia</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="font-display text-lg text-foreground">
                            {formatDuration(athlete.weeklyStats.duration)}
                          </div>
                          <div className="text-xs text-muted-foreground">Tiempo</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <div className="font-display text-lg text-foreground">
                            {athlete.weeklyStats.workouts}
                          </div>
                          <div className="text-xs text-muted-foreground">Entrenos</div>
                        </div>
                      </div>

                      {athlete.lastActivity && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-xs text-muted-foreground">Última actividad</p>
                          <p className="text-sm text-foreground truncate">{athlete.lastActivity.name}</p>
                          <p className="text-xs text-muted-foreground">
                            hace {athlete.daysSinceLastActivity} día{athlete.daysSinceLastActivity !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
