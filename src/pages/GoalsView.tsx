import { motion } from 'framer-motion';
import { Target, Calendar, MapPin, Mountain, Timer, ExternalLink, Plus, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { mockRaces } from '@/data/mockData';
import { getDaysUntil, formatDate, formatDuration } from '@/lib/workout-utils';

export default function GoalsView() {
  const upcomingRaces = mockRaces.filter(r => r.status === 'upcoming');
  const completedRaces = mockRaces.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">OBJETIVOS</h1>
          <p className="text-muted-foreground">Tus próximas carreras y metas</p>
        </div>
        <Button variant="hero">
          <Plus className="w-5 h-5" />
          Nueva Carrera
        </Button>
      </motion.div>

      {/* Upcoming Races */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-secondary" />
          <h2 className="font-display text-2xl text-foreground">PRÓXIMAS CARRERAS</h2>
        </div>

        {upcomingRaces.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-8 text-center"
          >
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Sin carreras planificadas</h3>
            <p className="text-muted-foreground mb-4">Añade tu próximo objetivo para empezar a entrenar</p>
            <Button variant="trail">
              <Plus className="w-5 h-5" />
              Añadir Carrera
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {upcomingRaces.map((race, index) => {
              const daysUntil = getDaysUntil(race.date);
              const progress = Math.min(100, Math.max(0, ((90 - daysUntil) / 90) * 100));
              
              return (
                <motion.div
                  key={race.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-xl overflow-hidden"
                >
                  <div className="relative p-6">
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 via-transparent to-primary/5" />
                    
                    <div className="relative">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        {/* Main Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-2 py-1 rounded-md bg-secondary/20 text-secondary text-xs font-medium">
                              {daysUntil} días
                            </span>
                            <span className="text-sm text-muted-foreground">{formatDate(race.date)}</span>
                          </div>
                          
                          <h3 className="font-display text-3xl text-foreground mb-3">{race.name}</h3>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="w-4 h-4 text-accent" />
                              {race.location}
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mountain className="w-4 h-4 text-secondary" />
                              {race.distance} km • +{race.expectedElevation}m
                            </div>
                            {race.targetTime && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Timer className="w-4 h-4 text-primary" />
                                Objetivo: {formatDuration(race.targetTime)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Countdown & Actions */}
                        <div className="flex flex-col items-end gap-4">
                          <div className="text-right">
                            <div className="font-display text-6xl text-gradient-energy">{daysUntil}</div>
                            <p className="text-sm text-muted-foreground">días restantes</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button variant="energy" size="sm">
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
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                          <span>Preparación</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Races */}
      {completedRaces.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="font-display text-2xl text-foreground">CARRERAS COMPLETADAS</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedRaces.map((race, index) => (
              <motion.div
                key={race.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-5 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium">
                    Completada
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(race.date)}</span>
                </div>
                
                <h3 className="font-display text-xl text-foreground mb-2">{race.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {race.location}
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span className="text-foreground font-medium">{race.distance} km</span>
                  <span className="text-muted-foreground">+{race.expectedElevation}m</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
