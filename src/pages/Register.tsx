import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, UserPlus, Users, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { invitationService } from '@/services/invitation.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RunnioLogo } from '@/components/ui/RunnioLogo';
import type { UserRole } from '@/types/auth';

export default function Register() {
  const [searchParams] = useSearchParams();
  const invitationCode = searchParams.get('code');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(invitationCode ? 'ATHLETE' : 'COACH');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<{
    valid: boolean;
    coach: { name: string };
  } | null>(null);

  const { register } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (invitationCode) {
      invitationService.verifyInvitation(invitationCode)
        .then((info) => {
          setInvitationInfo(info);
          if (info.email) setEmail(info.email);
        })
        .catch(() => {
          toast({
            variant: 'destructive',
            title: 'Código inválido',
            description: 'El código de invitación no es válido o ha expirado',
          });
        });
    }
  }, [invitationCode, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
        invitationCode: invitationCode || undefined,
      });
      toast({
        title: '¡Cuenta creada!',
        description: 'Tu cuenta ha sido creada exitosamente',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Error al crear la cuenta',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary/20 via-background to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <RunnioLogo size="xl" />
              <h1 className="font-display text-5xl text-gradient-trail">RUNN.IO</h1>
            </div>
            <h2 className="text-4xl font-display text-foreground mb-4">
              ÚNETE A LA<br />COMUNIDAD
            </h2>
            <p className="text-muted-foreground text-lg max-w-md">
              {invitationCode 
                ? 'Has sido invitado a unirte como atleta. Crea tu cuenta para comenzar.'
                : 'Crea tu cuenta como entrenador y comienza a gestionar tu equipo de atletas.'}
            </p>

            {invitationInfo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 glass rounded-xl p-6"
              >
                <p className="text-sm text-muted-foreground mb-2">Invitado por:</p>
                <p className="font-display text-2xl text-foreground">{invitationInfo.coach.name}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <RunnioLogo size="lg" />
            <h1 className="font-display text-4xl text-gradient-trail">RUNN.IO</h1>
          </div>

          <div className="glass rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-foreground">CREAR CUENTA</h2>
              <p className="text-muted-foreground mt-2">
                {invitationCode ? 'Regístrate como atleta' : 'Elige tu tipo de cuenta'}
              </p>
            </div>

            {!invitationCode && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setRole('COACH')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'COACH'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <Users className={`w-6 h-6 mx-auto mb-2 ${role === 'COACH' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-medium ${role === 'COACH' ? 'text-primary' : 'text-foreground'}`}>Entrenador</div>
                  <div className="text-xs text-muted-foreground">Gestiona atletas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ATHLETE')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === 'ATHLETE'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <User className={`w-6 h-6 mx-auto mb-2 ${role === 'ATHLETE' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-medium ${role === 'ATHLETE' ? 'text-primary' : 'text-foreground'}`}>Atleta</div>
                  <div className="text-xs text-muted-foreground">Con código de invitación</div>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              {role === 'ATHLETE' && !invitationCode && (
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Código de invitación</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="XXXXXXXX"
                    required
                    className="h-12 uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Solicita el código a tu entrenador
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
