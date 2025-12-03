import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Workout } from '@/types/workout';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface MiniMapProps {
  workouts: Workout[];
}

export function MiniMap({ workouts }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const workoutsWithLocation = workouts.filter(
    (w) => w.locationLat && w.locationLng
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([40.4168, -3.7038], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div class="w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg animate-pulse-glow"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    // Add markers for workouts with location
    workoutsWithLocation.slice(0, 5).forEach((workout) => {
      if (workout.locationLat && workout.locationLng) {
        L.marker([workout.locationLat, workout.locationLng], { icon: markerIcon })
          .addTo(map);
      }
    });

    // Fit bounds if we have markers
    if (workoutsWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        workoutsWithLocation.map((w) => [w.locationLat!, w.locationLng!])
      );
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [workoutsWithLocation]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="font-display text-xl text-foreground">MIS RUTAS</h3>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/map">Ver todo</Link>
        </Button>
      </div>
      
      <div ref={mapRef} className="h-48 w-full" />
      
      {workoutsWithLocation.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80">
          <p className="text-muted-foreground text-sm">
            Registra entrenamientos con ubicación
          </p>
        </div>
      )}
    </motion.div>
  );
}
