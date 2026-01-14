import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  LogOut,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Loader2,
  ExternalLink,
  Unlink,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { stravaService } from '@/services/strava.service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [stravaStatus, setStravaStatus] = useState<{
    connected: boolean;
    stravaAthleteId: string | null;
    lastSync: string | null;
  } | null>(null);
  const [isLoadingStrava, setIsLoadingStrava] = useState(true);
  const [isConnectingStrava, setIsConnectingStrava] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Cargar estado de Strava
  useEffect(() => {
    loadStravaStatus();
  }, []);

  // Manejar resultado de OAuth de Strava
  useEffect(() => {
    const stravaResult = searchParams.get('strava');
    const message = searchParams.get('message');

    if (stravaResult === 'success') {
      toast({
        title: '¡Strava conectado!',
        description: 'Tu cuenta de Strava ha sido vinculada exitosamente.',
      });
      loadStravaStatus();
      // Limpiar parámetros de URL
      navigate('/settings', { replace: true });
    } else if (stravaResult === 'error') {
      toast({
        variant: 'destructive',
        title: 'Error al conectar Strava',
        description: message || 'No se pudo vincular tu cuenta de Strava.',
      });
      navigate('/settings', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const loadStravaStatus = async () => {
    try {
      const status = await stravaService.getStatus();
      setStravaStatus(status);
    } catch (error) {
      console.error('Error loading Strava status:', error);
    } finally {
      setIsLoadingStrava(false);
    }
  };

  const handleConnectStrava = async () => {
    setIsConnectingStrava(true);
    try {
      const { authUrl } = await stravaService.getAuthUrl();
      // Redirigir a Strava para autorización
      window.location.href = authUrl;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo iniciar la conexión con Strava',
      });
      setIsConnectingStrava(false);
    }
  };

  const handleSyncStrava = async () => {
    setIsSyncing(true);
    try {
      const result = await stravaService.sync();
      toast({
        title: 'Sincronización completada',
        description: `Se sincronizaron ${result.syncedActivities} actividades nuevas.`,
      });
      loadStravaStatus();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron sincronizar las actividades',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectStrava = async () => {
    setIsDisconnecting(true);
    try {
      await stravaService.disconnect();
      setStravaStatus({ connected: false, stravaAthleteId: null, lastSync: null });
      toast({
        title: 'Strava desconectado',
        description: 'Tu cuenta de Strava ha sido desvinculada.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo desconectar Strava',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl">CONFIGURACIÓN</h1>
              <p className="text-xs text-muted-foreground">Ajustes de tu cuenta</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
        {/* Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-6"
        >
          <h2 className="font-display text-lg mb-4">PERFIL</h2>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar || undefined} />
              <AvatarFallback className="bg-gradient-trail text-primary-foreground text-xl">
                {user?.name ? getInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-display text-xl">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1">
                {user?.role === 'COACH' ? 'Entrenador' : 'Atleta'}
              </Badge>
            </div>
            <Button variant="ghost" size="icon">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Strava Connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#FC4C02] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
            </div>
            <div>
              <h2 className="font-display text-lg">STRAVA</h2>
              <p className="text-xs text-muted-foreground">Sincroniza tus actividades</p>
            </div>
          </div>

          {isLoadingStrava ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : stravaStatus?.connected ? (
            <div className="space-y-4">
              {/* Estado conectado */}
              <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <Check className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-green-500">Conectado</p>
                  <p className="text-xs text-muted-foreground">
                    ID de atleta: {stravaStatus.stravaAthleteId}
                  </p>
                </div>
              </div>

              {/* Última sincronización */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Última sincronización</span>
                <span className="text-foreground">{formatDate(stravaStatus.lastSync)}</span>
              </div>

              {/* Acciones */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSyncStrava}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar ahora
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <Unlink className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Desconectar Strava?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tu cuenta de Strava será desvinculada. Las actividades ya sincronizadas 
                        permanecerán en tu historial, pero no se sincronizarán nuevas actividades.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisconnectStrava}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDisconnecting}
                      >
                        {isDisconnecting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : null}
                        Desconectar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Estado desconectado */}
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Conecta tu cuenta de Strava para sincronizar automáticamente tus actividades de running.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2 justify-center">
                    <Check className="w-4 h-4 text-primary" />
                    Sincronización automática de carreras
                  </li>
                  <li className="flex items-center gap-2 justify-center">
                    <Check className="w-4 h-4 text-primary" />
                    Importa distancia, tiempo, ritmo y más
                  </li>
                  <li className="flex items-center gap-2 justify-center">
                    <Check className="w-4 h-4 text-primary" />
                    Mapas GPS de tus rutas
                  </li>
                </ul>
              </div>

              <Button
                className="w-full bg-[#FC4C02] hover:bg-[#FC4C02]/90 text-white"
                onClick={handleConnectStrava}
                disabled={isConnectingStrava}
              >
                {isConnectingStrava ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-2" />
                )}
                Conectar con Strava
              </Button>
            </div>
          )}
        </motion.div>

        {/* Notificaciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-lg">NOTIFICACIONES</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mensajes nuevos</p>
                <p className="text-xs text-muted-foreground">Recibe alertas de nuevos mensajes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Recordatorios de entrenamiento</p>
                <p className="text-xs text-muted-foreground">Notificaciones de sesiones programadas</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Resumen semanal</p>
                <p className="text-xs text-muted-foreground">Estadísticas de tu semana</p>
              </div>
              <Switch />
            </div>
          </div>
        </motion.div>

        {/* Seguridad */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-summit/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-summit" />
            </div>
            <h2 className="font-display text-lg">SEGURIDAD</h2>
          </div>

          <div className="space-y-3">
            <Button variant="ghost" className="w-full justify-between">
              <span>Cambiar contraseña</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="w-full justify-between">
              <span>Sesiones activas</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Cerrar sesión */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          <p>RUNN.IO v1.0.0</p>
          <p className="mt-1">© 2026 Todos los derechos reservados</p>
        </motion.div>
      </main>
    </div>
  );
}
