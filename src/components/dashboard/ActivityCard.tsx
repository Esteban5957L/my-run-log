import { motion } from 'framer-motion';
import { MapPin, Clock, TrendingUp, Mountain } from 'lucide-react';
import { Workout, ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/types/workout';
import { formatPace, formatDuration, formatDateShort } from '@/lib/workout-utils';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  workout: Workout;
  index?: number;
}

export function ActivityCard({ workout, index = 0 }: ActivityCardProps) {
  const activityColor = ACTIVITY_COLORS[workout.activityType];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="activity-card group cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Activity Type Indicator */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${activityColor}20` }}
        >
          <Mountain className="w-6 h-6" style={{ color: activityColor }} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">
                {ACTIVITY_LABELS[workout.activityType]}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDateShort(workout.date)}
                {workout.locationName && ` • ${workout.locationName}`}
              </p>
            </div>
            <span
              className="px-2 py-1 rounded-md text-xs font-medium flex-shrink-0"
              style={{ 
                backgroundColor: `${activityColor}20`,
                color: activityColor
              }}
            >
              {workout.distance.toFixed(1)} km
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(workout.duration)}</span>
            </div>
            {workout.avgPace && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>{formatPace(workout.avgPace)}/km</span>
              </div>
            )}
            {workout.elevationGain > 0 && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Mountain className="w-4 h-4" />
                <span>+{workout.elevationGain}m</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover Effect Bar */}
      <div
        className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-300 rounded-b-xl"
        style={{ backgroundColor: activityColor }}
      />
    </motion.div>
  );
}
