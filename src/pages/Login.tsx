import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: '¡Bienvenido!',
        description: 'Has iniciado sesión correctamente',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Credenciales inválidas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-secondary/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-trail flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-5xl text-gradient-trail">RUNN.IO</h1>
            </div>
            <h2 className="text-4xl font-display text-foreground mb-4">
              PLATAFORMA PARA<br />ENTRENADORES
            </h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Gestiona tus atletas, sincroniza con Strava, crea planes de entrenamiento 
              y comunícate en tiempo real.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 grid grid-cols-3 gap-6"
          >
            {[
              { label: 'Atletas', value: '∞' },
              { label: 'Actividades', value: 'Strava' },
              { label: 'Chat', value: 'Real-time' },
            ].map((stat, i) => (
              <div key={i} className="glass rounded-xl p-4 text-center">
                <div className="font-display text-2xl text-gradient-trail">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
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
            <div className="w-12 h-12 rounded-xl bg-gradient-trail flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl text-gradient-trail">RUNN.IO</h1>
          </div>

          <div className="glass rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-foreground">INICIAR SESIÓN</h2>
              <p className="text-muted-foreground mt-2">Accede a tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Regístrate
                </Link>
              </p>
            </div>

            {/* Demo accounts */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-center mb-3">Cuentas de prueba:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => { setEmail('coach@runnio.com'); setPassword('coach123'); }}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="font-medium text-foreground">Coach</div>
                  <div className="text-muted-foreground">coach@runnio.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('maria@example.com'); setPassword('atleta123'); }}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                >
                  <div className="font-medium text-foreground">Atleta</div>
                  <div className="text-muted-foreground">maria@example.com</div>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
