import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, TrendingUp, Mountain, MapPin, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockWorkouts } from '@/data/mockData';
import { Workout, ActivityType, ACTIVITY_LABELS, ACTIVITY_COLORS } from '@/types/workout';
import { formatDate, formatPace, formatDuration } from '@/lib/workout-utils';

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  
  const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  const workoutsWithLocation = mockWorkouts.filter(
    (w) => w.locationLat && w.locationLng
  );

  const filteredWorkouts = workoutsWithLocation.filter((w) => {
    if (filterType !== 'all' && w.activityType !== filterType) return false;
    if (filterYear !== 'all') {
      const year = new Date(w.date).getFullYear().toString();
      if (year !== filterYear) return false;
    }
    return true;
  });

  const totalDistance = filteredWorkouts.reduce((sum, w) => sum + w.distance, 0);
  const totalElevation = filteredWorkouts.reduce((sum, w) => sum + w.elevationGain, 0);
  const uniqueLocations = new Set(filteredWorkouts.map((w) => w.locationName)).size;

  const createMarkerPopup = (workout: Workout) => {
    const activityColor = ACTIVITY_COLORS[workout.activityType];
    return `
      <div class="p-3 min-w-[200px]">
        <div class="flex items-center gap-2 mb-2">
          <span class="px-2 py-0.5 rounded text-xs font-medium" 
                style="background: ${activityColor}20; color: ${activityColor}">
            ${ACTIVITY_LABELS[workout.activityType]}
          </span>
          <span class="text-xs text-muted-foreground">${formatDate(workout.date)}</span>
        </div>
        <h3 class="font-semibold text-foreground mb-2">${workout.locationName || 'Sin nombre'}</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-muted-foreground">Distancia</span>
            <p class="font-medium text-foreground">${workout.distance.toFixed(1)} km</p>
          </div>
          <div>
            <span class="text-muted-foreground">Tiempo</span>
            <p class="font-medium text-foreground">${formatDuration(workout.duration)}</p>
          </div>
          <div>
            <span class="text-muted-foreground">Desnivel</span>
            <p class="font-medium text-foreground">+${workout.elevationGain}m</p>
          </div>
          <div>
            <span class="text-muted-foreground">Ritmo</span>
            <p class="font-medium text-foreground">${workout.avgPace ? formatPace(workout.avgPace) : '--'}/km</p>
          </div>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
      }).setView([40.4168, -3.7038], 6);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers for filtered workouts
    filteredWorkouts.forEach((workout) => {
      if (!workout.locationLat || !workout.locationLng) return;

      const activityColor = ACTIVITY_COLORS[workout.activityType];
      
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative">
            <div class="w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                 style="background: ${activityColor}">
              <div class="w-2 h-2 bg-background rounded-full"></div>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                 style="background: ${activityColor}"></div>
          </div>
        `,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([workout.locationLat, workout.locationLng], {
        icon: markerIcon,
      })
        .addTo(mapInstanceRef.current!)
        .bindPopup(createMarkerPopup(workout), {
          className: 'custom-popup',
          maxWidth: 300,
        });

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (filteredWorkouts.length > 0) {
      const bounds = L.latLngBounds(
        filteredWorkouts.map((w) => [w.locationLat!, w.locationLng!])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      // Don't destroy the map, just clean up markers
    };
  }, [filteredWorkouts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-4xl sm:text-5xl text-foreground">MAPA DE CARRERAS</h1>
          <p className="text-muted-foreground">Explora todas tus rutas y entrenamientos</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-4"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          </div>

          <Select value={filterType} onValueChange={(v) => setFilterType(v as ActivityType | 'all')}>
            <SelectTrigger className="w-40 bg-muted border-border">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-32 bg-muted border-border">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <div className="glass rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total km</p>
            <p className="font-display text-2xl text-foreground">{totalDistance.toFixed(0)}</p>
          </div>
        </div>

        <div className="glass rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Mountain className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Desnivel</p>
            <p className="font-display text-2xl text-foreground">{totalElevation.toLocaleString()}m</p>
          </div>
        </div>

        <div className="glass rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lugares</p>
            <p className="font-display text-2xl text-foreground">{uniqueLocations}</p>
          </div>
        </div>

        <div className="glass rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Layers className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Actividades</p>
            <p className="font-display text-2xl text-foreground">{filteredWorkouts.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl overflow-hidden"
      >
        <div ref={mapRef} className="h-[500px] sm:h-[600px] w-full" />
      </motion.div>
    </div>
  );
}
