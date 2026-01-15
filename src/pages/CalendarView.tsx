import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar, Loader2, User, CheckCircle, Circle, SkipForward } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { planService, CalendarSession } from '@/services/plan.service';
import { athleteService } from '@/services/athlete.service';
import { Athlete } from '@/types/athlete';
import { SESSION_TYPE_LABELS, SESSION_TYPE_COLORS } from '@/types/plan';
import { useToast } from '@/hooks/use-toast';
import { RunnioLogo } from '@/components/ui/RunnioLogo';

export default function CalendarView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<CalendarSession[]>([]);
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, CalendarSession[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>('all');
  
  const isCoach = user?.role === 'COACH';
  const basePath = isCoach ? '/coach' : '';
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();
  
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, selectedAthleteId]);

  useEffect(() => {
    if (isCoach) {
      loadAthletes();
    }
  }, [isCoach]);

  const loadAthletes = async () => {
    try {
      const response = await athleteService.getMyAthletes();
      setAthletes(response.athletes);
    } catch (error) {
      console.error('Error loading athletes:', error);
    }
  };

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString();
      
      const response = await planService.getCalendarSessions(
        startDate, 
        endDate, 
        selectedAthleteId !== 'all' ? selectedAthleteId : undefined
      );
      
      setSessions(response.sessions);
      setSessionsByDate(response.sessionsByDate);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las sesiones',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getSessionsForDay = (day: number): CalendarSession[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessionsByDate[dateStr] || [];
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const renderDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < startingDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-24 p-2 bg-muted/20 rounded-lg" />
      );
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const daySessions = getSessionsForDay(day);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      days.push(
        <motion.div
          key={day}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: day * 0.01 }}
          className={cn(
            "min-h-24 p-2 rounded-lg border transition-all duration-200",
            "hover:border-primary/50",
            isToday ? "border-primary bg-primary/5" : "border-border/50 bg-card/50"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1",
            isToday ? "text-primary" : "text-foreground"
          )}>
            {day}
          </div>
          
          <div className="space-y-1">
            {daySessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`${basePath}/plans/${session.plan.id}`)}
                className={cn(
                  "text-xs p-1.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1",
                  SESSION_TYPE_COLORS[session.sessionType],
                  "text-white"
                )}
              >
                {session.completed ? (
                  <CheckCircle className="w-3 h-3 shrink-0" />
                ) : session.skipped ? (
                  <SkipForward className="w-3 h-3 shrink-0" />
                ) : (
                  <Circle className="w-3 h-3 shrink-0" />
                )}
                <span className="truncate">
                  {isCoach && session.plan.athlete && (
                    <span className="font-bold">{session.plan.athlete.name.split(' ')[0]}: </span>
                  )}
                  {session.title}
                </span>
              </div>
            ))}
            {daySessions.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{daySessions.length - 3} más
              </div>
            )}
          </div>
        </motion.div>
      );
    }
    
    return days;
  };

  // Calculate month stats
  const completedSessions = sessions.filter(s => s.completed).length;
  const totalSessions = sessions.length;
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(isCoach ? '/coach' : '/')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <RunnioLogo size="sm" />
              <div>
                <h1 className="font-display text-xl">CALENDARIO</h1>
                <p className="text-xs text-muted-foreground">Sesiones programadas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCoach && (
                <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                  <SelectTrigger className="w-[180px]">
                    <User className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Todos los atletas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los atletas</SelectItem>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={athlete.avatar || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {athlete.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          {athlete.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              {isCoach && (
                <Button onClick={() => navigate('/coach/plans/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Month Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="text-center">
              <h2 className="font-display text-3xl text-foreground capitalize">{monthName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {totalSessions} sesiones • {completedSessions} completadas • {completionRate}% cumplimiento
              </p>
            </div>
            
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Week days header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-2">
                {renderDays()}
              </div>
            </>
          )}
        </motion.div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4"
        >
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Tipos de Sesión</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <div
                  className={cn("w-3 h-3 rounded-full", SESSION_TYPE_COLORS[key as keyof typeof SESSION_TYPE_COLORS])}
                />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Completada
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Circle className="w-4 h-4" />
              Pendiente
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SkipForward className="w-4 h-4 text-gray-500" />
              Saltada
            </div>
          </div>
        </motion.div>

        {/* No sessions message */}
        {!isLoading && sessions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-8 text-center"
          >
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl mb-2">Sin sesiones este mes</h3>
            <p className="text-muted-foreground mb-4">
              {isCoach 
                ? 'No hay sesiones programadas para tus atletas este mes.'
                : 'No tienes sesiones programadas este mes.'}
            </p>
            {isCoach && (
              <Button onClick={() => navigate('/coach/plans/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Plan
              </Button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
