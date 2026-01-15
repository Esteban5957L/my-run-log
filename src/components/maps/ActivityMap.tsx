import { lazy, Suspense, useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

// Lazy load del componente de Leaflet - SOLO se carga en el cliente
const LeafletMap = lazy(() => import('./LeafletMap'));

interface ActivityMapProps {
  polyline: string;
  startLat?: number | null;
  startLng?: number | null;
}

export default function ActivityMap({ polyline, startLat, startLng }: ActivityMapProps) {
  // Estado para verificar que estamos en el cliente
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Solo se ejecuta en el cliente
    setIsClient(true);
  }, []);

  // Loading placeholder
  const LoadingPlaceholder = () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
    </div>
  );

  // No renderizar en el servidor
  if (!isClient) {
    return <LoadingPlaceholder />;
  }

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <LeafletMap 
        polyline={polyline}
        startLat={startLat}
        startLng={startLng}
      />
    </Suspense>
  );
}
