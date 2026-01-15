import { useMemo } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

// Decodificar polyline de Google/Strava
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

interface ActivityMapProps {
  polyline: string;
  startLat?: number | null;
  startLng?: number | null;
}

export default function ActivityMap({ polyline, startLat, startLng }: ActivityMapProps) {
  const mapData = useMemo(() => {
    const points = decodePolyline(polyline);
    if (points.length === 0) return null;

    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Calcular zoom
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 14;
    if (maxDiff > 0.5) zoom = 10;
    else if (maxDiff > 0.2) zoom = 11;
    else if (maxDiff > 0.1) zoom = 12;
    else if (maxDiff > 0.05) zoom = 13;
    else if (maxDiff > 0.02) zoom = 14;
    else zoom = 15;

    return {
      center: { lat: centerLat, lng: centerLng },
      bounds: { minLat, maxLat, minLng, maxLng },
      zoom,
      endPoint: points[points.length - 1],
    };
  }, [polyline]);

  if (!mapData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Sin datos de mapa</p>
      </div>
    );
  }

  const { center, bounds, zoom } = mapData;
  
  // Padding para el bbox
  const padding = 0.002;
  const bbox = `${bounds.minLng - padding},${bounds.minLat - padding},${bounds.maxLng + padding},${bounds.maxLat + padding}`;
  
  // URL del iframe de OpenStreetMap
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${startLat || center.lat},${startLng || center.lng}`;
  
  // URL para abrir en OSM
  const osmUrl = `https://www.openstreetmap.org/?mlat=${startLat || center.lat}&mlon=${startLng || center.lng}#map=${zoom}/${center.lat}/${center.lng}`;

  return (
    <div className="h-full w-full relative bg-muted/20">
      {/* Iframe de OpenStreetMap */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        title="Mapa del recorrido"
        loading="lazy"
        allowFullScreen
      />
      
      {/* Overlay con info */}
      <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-xs flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-foreground">Inicio</span>
        </div>
        {startLat && startLng && (
          <span className="text-muted-foreground">
            {startLat.toFixed(4)}, {startLng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Link para ver en OSM */}
      <a
        href={osmUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg px-3 py-2 text-xs hover:bg-background transition-colors flex items-center gap-1.5 shadow-lg"
      >
        <ExternalLink className="w-3 h-3" />
        Ver en mapa
      </a>
    </div>
  );
}
