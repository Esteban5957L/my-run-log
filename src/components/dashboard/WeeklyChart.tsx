import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { WeeklyStats } from '@/types/workout';

interface WeeklyChartProps {
  data: WeeklyStats[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-lg p-3 shadow-elevated">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <p className="text-lg font-display text-primary">
          {payload[0].value?.toFixed(1)} km
        </p>
      </div>
    );
  }
  return null;
};

export function WeeklyChart({ data }: WeeklyChartProps) {
  const chartData = data.slice(-8).map((week) => ({
    name: new Date(week.weekStart).toLocaleDateString('es-ES', { 
      day: 'numeric',
      month: 'short' 
    }),
    km: week.totalDistance,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="font-display text-2xl text-foreground mb-6">
        VOLUMEN SEMANAL
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              vertical={false}
            />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar
              dataKey="km"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
