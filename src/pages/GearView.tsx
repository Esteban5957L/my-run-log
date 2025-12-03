import { motion } from 'framer-motion';
import { Footprints, Plus, AlertTriangle, CheckCircle, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockShoes } from '@/data/mockData';
import { formatDate } from '@/lib/workout-utils';
import { cn } from '@/lib/utils';

export default function GearView() {
  const activeShoes = mockShoes.filter(s => s.status === 'active');
  const retiredShoes = mockShoes.filter(s => s.status === 'retired');

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">EQUIPAMIENTO</h1>
          <p className="text-muted-foreground">Gestiona tus zapatillas y controla el desgaste</p>
        </div>
        <Button variant="hero">
          <Plus className="w-5 h-5" />
          Añadir Zapatillas
        </Button>
      </motion.div>

      {/* Active Shoes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-primary" />
          <h2 className="font-display text-2xl text-foreground">ZAPATILLAS ACTIVAS</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeShoes.map((shoe, index) => {
            const wearPercentage = (shoe.totalKm / shoe.maxKmRecommended) * 100;
            const isWorn = wearPercentage >= 80;
            
            return (
              <motion.div
                key={shoe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "glass rounded-xl p-5 border transition-colors",
                  isWorn ? "border-secondary/50" : "border-border/50"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{shoe.brand}</h3>
                    <p className="text-lg font-display text-primary">{shoe.model}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    shoe.shoeType === 'trail' 
                      ? "bg-primary/20 text-primary" 
                      : shoe.shoeType === 'road'
                      ? "bg-accent/20 text-accent"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {shoe.shoeType === 'trail' ? 'Trail' : shoe.shoeType === 'road' ? 'Road' : 'Mixto'}
                  </span>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Kilometraje</span>
                      <span className={cn(
                        "font-medium",
                        isWorn ? "text-secondary" : "text-foreground"
                      )}>
                        {shoe.totalKm} / {shoe.maxKmRecommended} km
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(wearPercentage, 100)} 
                      className={cn(
                        "h-2",
                        isWorn && "[&>div]:bg-secondary"
                      )}
                    />
                  </div>

                  {isWorn && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/10 border border-secondary/30">
                      <AlertTriangle className="w-4 h-4 text-secondary flex-shrink-0" />
                      <p className="text-xs text-secondary">Alto desgaste - considera reemplazar</p>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Compradas el {formatDate(shoe.purchaseDate)}</span>
                    <span>{Math.round(wearPercentage)}% usado</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <h3 className="font-display text-xl text-foreground mb-4">RESUMEN</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Zapatillas activas</p>
            <p className="font-display text-3xl text-foreground">{activeShoes.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Km totales</p>
            <p className="font-display text-3xl text-primary">
              {activeShoes.reduce((sum, s) => sum + s.totalKm, 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Necesitan cambio</p>
            <p className="font-display text-3xl text-secondary">
              {activeShoes.filter(s => (s.totalKm / s.maxKmRecommended) >= 0.8).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Retiradas</p>
            <p className="font-display text-3xl text-muted-foreground">{retiredShoes.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Retired Shoes */}
      {retiredShoes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-display text-2xl text-foreground">RETIRADAS</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {retiredShoes.map((shoe, index) => (
              <motion.div
                key={shoe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-lg p-4 opacity-60"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Retirada</span>
                </div>
                <h4 className="font-medium text-foreground">{shoe.brand} {shoe.model}</h4>
                <p className="text-sm text-muted-foreground">{shoe.totalKm} km recorridos</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
