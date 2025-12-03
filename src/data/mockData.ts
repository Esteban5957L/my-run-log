import { Workout, Race, Shoe, WeeklyStats } from '@/types/workout';
import { calculatePace } from '@/lib/workout-utils';

export const mockWorkouts: Workout[] = [
  {
    id: '1',
    date: '2025-12-02',
    time: '07:30',
    activityType: 'trail',
    distance: 15.2,
    duration: 5580, // 1:33:00
    elevationGain: 650,
    elevationLoss: 645,
    avgPace: calculatePace(15.2, 5580),
    avgHeartRate: 155,
    maxHeartRate: 178,
    perceivedEffort: 7,
    weather: 'Soleado',
    temperature: 8,
    terrainType: 'trail',
    locationName: 'Sierra de Guadarrama',
    locationLat: 40.7866,
    locationLng: -3.9627,
    notes: 'Gran entrenamiento por los senderos. Piernas fuertes.',
    status: 'completed',
    createdAt: '2025-12-02T08:30:00Z',
    updatedAt: '2025-12-02T08:30:00Z',
  },
  {
    id: '2',
    date: '2025-11-30',
    time: '08:00',
    activityType: 'running',
    distance: 10.0,
    duration: 2940, // 49:00
    elevationGain: 45,
    elevationLoss: 45,
    avgPace: calculatePace(10.0, 2940),
    avgHeartRate: 148,
    maxHeartRate: 162,
    perceivedEffort: 5,
    weather: 'Nublado',
    temperature: 12,
    terrainType: 'asphalt',
    locationName: 'Casa de Campo, Madrid',
    locationLat: 40.4195,
    locationLng: -3.7468,
    status: 'completed',
    createdAt: '2025-11-30T09:00:00Z',
    updatedAt: '2025-11-30T09:00:00Z',
  },
  {
    id: '3',
    date: '2025-11-28',
    time: '18:30',
    activityType: 'intervals',
    distance: 8.5,
    duration: 2400, // 40:00
    elevationGain: 30,
    elevationLoss: 30,
    avgPace: calculatePace(8.5, 2400),
    avgHeartRate: 168,
    maxHeartRate: 185,
    perceivedEffort: 8,
    weather: 'Despejado',
    temperature: 15,
    terrainType: 'asphalt',
    locationName: 'Pista de Atletismo',
    locationLat: 40.4530,
    locationLng: -3.6883,
    notes: '8x400m con recuperación 200m trote',
    status: 'completed',
    createdAt: '2025-11-28T19:30:00Z',
    updatedAt: '2025-11-28T19:30:00Z',
  },
  {
    id: '4',
    date: '2025-11-26',
    time: '07:00',
    activityType: 'long_run',
    distance: 22.0,
    duration: 7200, // 2:00:00
    elevationGain: 180,
    elevationLoss: 175,
    avgPace: calculatePace(22.0, 7200),
    avgHeartRate: 145,
    maxHeartRate: 158,
    perceivedEffort: 6,
    weather: 'Frío',
    temperature: 5,
    terrainType: 'mixed',
    locationName: 'Anillo Verde Madrid',
    locationLat: 40.4500,
    locationLng: -3.6833,
    status: 'completed',
    createdAt: '2025-11-26T09:00:00Z',
    updatedAt: '2025-11-26T09:00:00Z',
  },
  {
    id: '5',
    date: '2025-11-24',
    time: '09:00',
    activityType: 'trail',
    distance: 18.5,
    duration: 7500, // 2:05:00
    elevationGain: 920,
    elevationLoss: 915,
    avgPace: calculatePace(18.5, 7500),
    avgHeartRate: 158,
    maxHeartRate: 175,
    perceivedEffort: 8,
    weather: 'Soleado',
    temperature: 10,
    terrainType: 'mountain',
    locationName: 'La Pedriza',
    locationLat: 40.7589,
    locationLng: -3.8873,
    notes: 'Subida técnica, vistas increíbles desde la cumbre',
    status: 'completed',
    createdAt: '2025-11-24T11:30:00Z',
    updatedAt: '2025-11-24T11:30:00Z',
  },
  {
    id: '6',
    date: '2025-11-22',
    time: '18:00',
    activityType: 'recovery',
    distance: 6.0,
    duration: 2160, // 36:00
    elevationGain: 20,
    elevationLoss: 20,
    avgPace: calculatePace(6.0, 2160),
    avgHeartRate: 128,
    perceivedEffort: 3,
    terrainType: 'asphalt',
    locationName: 'Retiro, Madrid',
    locationLat: 40.4153,
    locationLng: -3.6844,
    status: 'completed',
    createdAt: '2025-11-22T18:40:00Z',
    updatedAt: '2025-11-22T18:40:00Z',
  },
];

export const mockRaces: Race[] = [
  {
    id: '1',
    name: 'Los Túneles Trail',
    date: '2026-02-22',
    distance: 42,
    expectedElevation: 2100,
    targetTime: 18000, // 5:00:00
    location: 'Valencia',
    locationLat: 39.4699,
    locationLng: -0.3763,
    raceUrl: 'https://example.com/tuneles',
    status: 'upcoming',
    createdAt: '2025-10-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Madrid Half Marathon',
    date: '2026-04-12',
    distance: 21.1,
    expectedElevation: 150,
    targetTime: 5400, // 1:30:00
    location: 'Madrid',
    locationLat: 40.4168,
    locationLng: -3.7038,
    status: 'upcoming',
    createdAt: '2025-11-15T10:00:00Z',
  },
];

export const mockShoes: Shoe[] = [
  {
    id: '1',
    brand: 'Salomon',
    model: 'Speedcross 6',
    purchaseDate: '2025-06-15',
    totalKm: 387,
    maxKmRecommended: 800,
    shoeType: 'trail',
    status: 'active',
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: '2',
    brand: 'Nike',
    model: 'Pegasus 40',
    purchaseDate: '2025-03-01',
    totalKm: 612,
    maxKmRecommended: 700,
    shoeType: 'road',
    status: 'active',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: '3',
    brand: 'HOKA',
    model: 'Mafate Speed 4',
    purchaseDate: '2025-08-20',
    totalKm: 245,
    maxKmRecommended: 600,
    shoeType: 'trail',
    status: 'active',
    createdAt: '2025-08-20T10:00:00Z',
  },
];

export const mockWeeklyStats: WeeklyStats[] = [
  { weekStart: '2025-10-14', totalDistance: 42.5, totalElevation: 850, totalDuration: 14400, workoutCount: 4, avgPace: 339 },
  { weekStart: '2025-10-21', totalDistance: 55.2, totalElevation: 1200, totalDuration: 19800, workoutCount: 5, avgPace: 359 },
  { weekStart: '2025-10-28', totalDistance: 48.0, totalElevation: 980, totalDuration: 16200, workoutCount: 4, avgPace: 338 },
  { weekStart: '2025-11-04', totalDistance: 62.3, totalElevation: 1450, totalDuration: 22500, workoutCount: 5, avgPace: 361 },
  { weekStart: '2025-11-11', totalDistance: 38.5, totalElevation: 720, totalDuration: 13500, workoutCount: 3, avgPace: 351 },
  { weekStart: '2025-11-18', totalDistance: 52.5, totalElevation: 1100, totalDuration: 18000, workoutCount: 4, avgPace: 343 },
  { weekStart: '2025-11-25', totalDistance: 58.5, totalElevation: 1300, totalDuration: 20700, workoutCount: 5, avgPace: 354 },
  { weekStart: '2025-12-02', totalDistance: 15.2, totalElevation: 650, totalDuration: 5580, workoutCount: 1, avgPace: 367 },
];

export function getMonthStats(workouts: Workout[]) {
  const now = new Date();
  const thisMonth = workouts.filter((w) => {
    const date = new Date(w.date);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const totalDistance = thisMonth.reduce((sum, w) => sum + w.distance, 0);
  const totalElevation = thisMonth.reduce((sum, w) => sum + w.elevationGain, 0);
  const totalDuration = thisMonth.reduce((sum, w) => sum + w.duration, 0);
  const avgPace = totalDistance > 0 ? totalDuration / totalDistance : 0;

  return {
    totalDistance,
    totalElevation,
    totalDuration,
    workoutCount: thisMonth.length,
    avgPace,
  };
}
