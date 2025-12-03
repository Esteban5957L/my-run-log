import { Workout, WeeklyStats } from '@/types/workout';

export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatDurationLong(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

export function parseDuration(duration: string): number {
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function calculatePace(distanceKm: number, durationSeconds: number): number {
  if (distanceKm === 0) return 0;
  return durationSeconds / distanceKm;
}

export function calculateVAM(elevationGain: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  return (elevationGain / durationSeconds) * 3600;
}

export function calculateElevationDensity(elevationGain: number, distanceKm: number): number {
  if (distanceKm === 0) return 0;
  return elevationGain / distanceKm;
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeeklyStats(workouts: Workout[]): WeeklyStats[] {
  const weekMap = new Map<string, Workout[]>();
  
  workouts.forEach(workout => {
    const weekStart = getWeekStart(new Date(workout.date)).toISOString().split('T')[0];
    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, []);
    }
    weekMap.get(weekStart)!.push(workout);
  });

  return Array.from(weekMap.entries()).map(([weekStart, workouts]) => {
    const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
    const totalElevation = workouts.reduce((sum, w) => sum + w.elevationGain, 0);
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;

    return {
      weekStart,
      totalDistance,
      totalElevation,
      totalDuration,
      workoutCount: workouts.length,
      avgPace,
    };
  }).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export function getDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  });
}
