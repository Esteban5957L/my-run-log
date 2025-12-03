import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { mockWorkouts } from '@/data/mockData';
import { Workout, ACTIVITY_COLORS, ACTIVITY_LABELS } from '@/types/workout';
import { formatDuration } from '@/lib/workout-utils';
import { cn } from '@/lib/utils';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDay = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();
  
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getWorkoutsForDay = (day: number): Workout[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return mockWorkouts.filter(w => w.date === dateStr);
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
      const workouts = getWorkoutsForDay(day);
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
      
      days.push(
        <motion.div
          key={day}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: day * 0.01 }}
          className={cn(
            "min-h-24 p-2 rounded-lg border transition-all duration-200",
            "hover:border-primary/50 cursor-pointer",
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
            {workouts.slice(0, 2).map((workout) => (
              <div
                key={workout.id}
                className="text-xs p-1.5 rounded truncate"
                style={{
                  backgroundColor: `${ACTIVITY_COLORS[workout.activityType]}20`,
                  color: ACTIVITY_COLORS[workout.activityType],
                }}
              >
                <span className="font-medium">{workout.distance}km</span>
                <span className="hidden sm:inline"> • {formatDuration(workout.duration)}</span>
              </div>
            ))}
            {workouts.length > 2 && (
              <div className="text-xs text-muted-foreground">
                +{workouts.length - 2} más
              </div>
            )}
          </div>
        </motion.div>
      );
    }
    
    return days;
  };

  // Calculate month stats
  const monthWorkouts = mockWorkouts.filter(w => {
    const d = new Date(w.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  
  const monthDistance = monthWorkouts.reduce((sum, w) => sum + w.distance, 0);
  const monthElevation = monthWorkouts.reduce((sum, w) => sum + w.elevationGain, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">CALENDARIO</h1>
          <p className="text-muted-foreground">Planifica y visualiza tus entrenamientos</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/log">
            <Plus className="w-5 h-5" />
            Nuevo Entrenamiento
          </Link>
        </Button>
      </motion.div>

      {/* Month Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="font-display text-3xl text-foreground capitalize">{monthName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {monthWorkouts.length} entrenamientos • {monthDistance.toFixed(1)} km • +{monthElevation}m
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
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-4"
      >
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
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-4"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Leyenda</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS] }}
              />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
