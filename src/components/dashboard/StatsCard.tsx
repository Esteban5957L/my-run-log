import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  variant?: 'default' | 'primary' | 'secondary' | 'accent';
  delay?: number;
}

export function StatsCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  variant = 'default',
  delay = 0,
}: StatsCardProps) {
  const variants = {
    default: 'from-muted/50 to-muted/30',
    primary: 'from-primary/20 to-primary/5',
    secondary: 'from-secondary/20 to-secondary/5',
    accent: 'from-accent/20 to-accent/5',
  };

  const iconColors = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative overflow-hidden rounded-xl p-5 glass border border-border/50",
        "hover:border-primary/30 transition-all duration-300"
      )}
    >
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-50",
        variants[variant]
      )} />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
          <div className="flex items-baseline">
            <span className="stat-number text-foreground">{value}</span>
            {unit && <span className="stat-unit">{unit}</span>}
          </div>
          {trend !== undefined && (
            <p className={cn(
              "text-xs mt-2 font-medium",
              trend > 0 ? "text-primary" : trend < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}% vs semana anterior
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br",
          variants[variant]
        )}>
          <Icon className={cn("w-6 h-6", iconColors[variant])} />
        </div>
      </div>
    </motion.div>
  );
}
