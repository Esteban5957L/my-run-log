import { useMemo } from 'react';
import { MapPin, Navigation } from 'lucide-react';

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
  // Decodificar y simplificar polyline para la URL (máximo ~100 puntos)
  const { encodedPath, center, bounds } = useMemo(() => {
    const points = decodePolyline(polyline);
    if (points.length === 0) return { encodedPath: '', center: null, bounds: null };

    // Calcular centro y bounds
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Simplificar puntos para la URL (tomar cada N puntos)
    const step = Math.max(1, Math.floor(points.length / 80));
    const simplified = points.filter((_, i) => i % step === 0 || i === points.length - 1);

    // Crear path para OpenStreetMap static map
    const pathStr = simplified.map(p => `${p[0].toFixed(5)},${p[1].toFixed(5)}`).join('|');

    return {
      encodedPath: pathStr,
      center: { lat: centerLat, lng: centerLng },
      bounds: { minLat, maxLat, minLng, maxLng }
    };
  }, [polyline]);

  // Calcular zoom basado en el tamaño del área
  const zoom = useMemo(() => {
    if (!bounds) return 13;
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 0.5) return 10;
    if (maxDiff > 0.2) return 11;
    if (maxDiff > 0.1) return 12;
    if (maxDiff > 0.05) return 13;
    if (maxDiff > 0.02) return 14;
    return 15;
  }, [bounds]);

  if (!center) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Sin datos de mapa</p>
      </div>
    );
  }

  // Usar OpenStreetMap Static Map API (gratuito)
  // Alternativa: usar una imagen SVG del recorrido
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bounds?.minLng},${bounds?.minLat},${bounds?.maxLng},${bounds?.maxLat}&layer=mapnik&marker=${startLat || center.lat},${startLng || center.lng}`;

  return (
    <div className="h-full w-full relative">
      {/* Iframe de OpenStreetMap */}
      <iframe
        src={mapUrl}
        className="w-full h-full border-0"
        style={{ filter: 'saturate(0.8) contrast(1.1)' }}
        title="Mapa del recorrido"
        loading="lazy"
      />
      
      {/* Overlay con info */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs flex items-center gap-4">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-green-500" />
          <span>Inicio</span>
        </div>
        {startLat && startLng && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Navigation className="w-3 h-3" />
            <span>{startLat.toFixed(4)}, {startLng.toFixed(4)}</span>
          </div>
        )}
      </div>

      {/* Link para ver en OSM */}
      <a
        href={`https://www.openstreetmap.org/?mlat=${startLat || center.lat}&mlon=${startLng || center.lng}#map=${zoom}/${center.lat}/${center.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs hover:bg-background transition-colors"
      >
        Ver en OpenStreetMap →
      </a>
    </div>
  );
}
