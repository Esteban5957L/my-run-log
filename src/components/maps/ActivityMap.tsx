import { lazy, Suspense, useState, useEffect } from 'react';
import { Loader2, Map } from 'lucide-react';

// Lazy load del componente MapLibre - solo se carga cuando se necesita
const MapLibreMap = lazy(() => import('./MapLibreMap'));

interface ActivityMapProps {
  polyline: string;
  startLat?: number | null;
  startLng?: number | null;
}

export default function ActivityMap({ polyline, startLat, startLng }: ActivityMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const LoadingPlaceholder = () => (
    <div className="h-full w-full flex flex-col items-center justify-center bg-muted/30 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Cargando mapa...</p>
    </div>
  );

  if (!isClient) {
    return <LoadingPlaceholder />;
  }

  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <MapLibreMap 
        polyline={polyline}
        startLat={startLat}
        startLng={startLng}
      />
    </Suspense>
  );
}
