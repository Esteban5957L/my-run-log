import { useEffect, useState } from 'react';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Decodificar polyline de Google/Strava
function decodePolyline(encoded: string): LatLngExpression[] {
  const points: LatLngExpression[] = [];
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
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: any;
    TileLayer: any;
    Polyline: any;
    CircleMarker: any;
  } | null>(null);

  // Cargar react-leaflet dinámicamente solo en el cliente
  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setMapComponents({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        Polyline: mod.Polyline,
        CircleMarker: mod.CircleMarker,
      });
    });
  }, []);

  // Decodificar polyline
  const routePoints = decodePolyline(polyline);

  // Calcular bounds del mapa
  const mapBounds = (() => {
    if (routePoints.length === 0) return null;
    const lats = routePoints.map(p => (p as [number, number])[0]);
    const lngs = routePoints.map(p => (p as [number, number])[1]);
    return new LatLngBounds(
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    );
  })();

  if (!MapComponents || !mapBounds || routePoints.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Polyline, CircleMarker } = MapComponents;

  return (
    <MapContainer
      bounds={mapBounds}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={routePoints}
        pathOptions={{ color: '#f97316', weight: 4 }}
      />
      {startLat && startLng && (
        <CircleMarker 
          center={[startLat, startLng]} 
          radius={8}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
