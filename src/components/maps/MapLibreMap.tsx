import { useMemo, useCallback } from 'react';
import Map, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

// Decodificar polyline de Google/Strava a GeoJSON
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

    // GeoJSON usa [lng, lat]
    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

interface MapLibreMapProps {
  polyline: string;
  startLat?: number | null;
  startLng?: number | null;
}

export default function MapLibreMap({ polyline, startLat, startLng }: MapLibreMapProps) {
  // Decodificar polyline y calcular bounds
  const mapData = useMemo(() => {
    const coordinates = decodePolyline(polyline);
    if (coordinates.length === 0) return null;

    const lngs = coordinates.map(p => p[0]);
    const lats = coordinates.map(p => p[1]);
    
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calcular zoom basado en el tamaño del área
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 14;
    if (maxDiff > 0.5) zoom = 9;
    else if (maxDiff > 0.2) zoom = 10;
    else if (maxDiff > 0.1) zoom = 11;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.02) zoom = 13;
    else if (maxDiff > 0.01) zoom = 14;
    else zoom = 15;

    // GeoJSON para la línea
    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };

    return {
      center: { lng: centerLng, lat: centerLat },
      zoom,
      geojson,
      startPoint: coordinates[0],
      endPoint: coordinates[coordinates.length - 1],
    };
  }, [polyline]);

  if (!mapData) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/30">
        <p className="text-muted-foreground">Sin datos de ruta</p>
      </div>
    );
  }

  return (
    <Map
      initialViewState={{
        longitude: mapData.center.lng,
        latitude: mapData.center.lat,
        zoom: mapData.zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      attributionControl={true}
    >
      {/* Controles de navegación */}
      <NavigationControl position="top-right" showCompass={false} />

      {/* Línea del recorrido */}
      <Source id="route" type="geojson" data={mapData.geojson}>
        <Layer
          id="route-line-bg"
          type="line"
          paint={{
            'line-color': '#000000',
            'line-width': 6,
            'line-opacity': 0.3,
          }}
        />
        <Layer
          id="route-line"
          type="line"
          paint={{
            'line-color': '#f97316',
            'line-width': 4,
            'line-opacity': 1,
          }}
        />
      </Source>

      {/* Marcador de inicio (verde) */}
      <Marker 
        longitude={startLng || mapData.startPoint[0]} 
        latitude={startLat || mapData.startPoint[1]} 
        anchor="center"
      >
        <div className="relative">
          <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-lg" />
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white bg-green-600 px-1.5 py-0.5 rounded whitespace-nowrap">
            Inicio
          </div>
        </div>
      </Marker>

      {/* Marcador de fin (rojo) */}
      <Marker longitude={mapData.endPoint[0]} latitude={mapData.endPoint[1]} anchor="center">
        <div className="relative">
          <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-lg" />
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-white bg-red-600 px-1.5 py-0.5 rounded whitespace-nowrap">
            Fin
          </div>
        </div>
      </Marker>
    </Map>
  );
}
