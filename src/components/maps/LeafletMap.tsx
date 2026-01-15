// Este componente SOLO se importa dinámicamente, nunca directamente
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface LeafletMapProps {
  polyline: string;
  startLat?: number | null;
  startLng?: number | null;
}

export default function LeafletMap({ polyline, startLat, startLng }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Decodificar polyline
  const routePoints = decodePolyline(polyline);

  // Calcular bounds
  const bounds = (() => {
    if (routePoints.length === 0) return null;
    const lats = routePoints.map(p => p[0]);
    const lngs = routePoints.map(p => p[1]);
    return L.latLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  })();

  // Ajustar bounds cuando el mapa se carga
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds]);

  if (!bounds || routePoints.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Sin datos de ruta</p>
      </div>
    );
  }

  // Punto final del recorrido
  const endPoint = routePoints[routePoints.length - 1];

  return (
    <MapContainer
      ref={mapRef}
      bounds={bounds}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Línea del recorrido */}
      <Polyline
        positions={routePoints}
        pathOptions={{ 
          color: '#f97316', 
          weight: 4,
          opacity: 0.9,
        }}
      />
      
      {/* Marcador de inicio (verde) */}
      {startLat && startLng && (
        <CircleMarker 
          center={[startLat, startLng]} 
          radius={8}
          pathOptions={{ 
            color: '#16a34a', 
            fillColor: '#22c55e', 
            fillOpacity: 1,
            weight: 2,
          }}
        />
      )}
      
      {/* Marcador de fin (rojo) */}
      <CircleMarker 
        center={endPoint} 
        radius={8}
        pathOptions={{ 
          color: '#dc2626', 
          fillColor: '#ef4444', 
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </MapContainer>
  );
}
