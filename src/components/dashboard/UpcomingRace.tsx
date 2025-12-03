import { motion } from 'framer-motion';
import { Calendar, MapPin, Mountain, Timer, ExternalLink } from 'lucide-react';
import { Race } from '@/types/workout';
import { getDaysUntil, formatDate, formatDuration } from '@/lib/workout-utils';
import { Button } from '@/components/ui/button';

interface UpcomingRaceProps {
  race: Race;
}

export function UpcomingRace({ race }: UpcomingRaceProps) {
  const daysUntil = getDaysUntil(race.date);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="relative overflow-hidden rounded-xl glass border border-secondary/30"
    >
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-secondary mb-1">PRÓXIMA CARRERA</p>
            <h3 className="font-display text-3xl text-foreground">{race.name}</h3>
          </div>
          <div className="text-right">
            <div className="font-display text-5xl text-gradient-energy">{daysUntil}</div>
            <p className="text-sm text-muted-foreground">días</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-secondary" />
            <span>{formatDate(race.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-secondary" />
            <span className="truncate">{race.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mountain className="w-4 h-4 text-primary" />
            <span>{race.distance} km • +{race.expectedElevation}m</span>
          </div>
          {race.targetTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="w-4 h-4 text-accent" />
              <span>Objetivo: {formatDuration(race.targetTime)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Preparación</span>
            <span>68%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '68%' }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="energy" size="sm" className="flex-1">
            Ver Plan
          </Button>
          {race.raceUrl && (
            <Button variant="glass" size="sm" asChild>
              <a href={race.raceUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
