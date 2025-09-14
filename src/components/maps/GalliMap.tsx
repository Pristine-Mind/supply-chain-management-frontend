import React, { useEffect, useRef } from 'react';

type LatLng = { lat: number; lng: number };

export interface GeoapifyDelivery {
  id: number | string;
  pickup_latitude?: number | string;
  pickup_longitude?: number | string;
  delivery_latitude?: number | string;
  delivery_longitude?: number | string;
  priority?: string | null;
  tracking_number?: string;
  pickup_address?: string;
  delivery_address?: string;
  delivery_fee?: string | number;
}

interface Props {
  apiKey: string;
  center: LatLng;
  deliveries: GeoapifyDelivery[];
  userLocation?: LatLng | null;
  routeGeoJson?: GeoJSON.FeatureCollection | null;
  routeSegments?: Array<{ geojson: GeoJSON.FeatureCollection; color?: string; name?: string }>;
  followUser?: boolean;
}

const GalliMap: React.FC<Props> = ({ apiKey: _apiKey, center, deliveries, userLocation, routeGeoJson, routeSegments, followUser }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerIdRef = useRef<string>(`galli-map-${Math.random().toString(36).slice(2)}`);
  const mapRef = useRef<any | null>(null);
  const panoIdRef = useRef<string>(`${containerIdRef.current}-pano`);
  const pickupMarkersRef = useRef<any[]>([]);
  const destinationMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any | null>(null);
  const drawnRouteNamesRef = useRef<string[]>([]);
  const segLabelMarkersRef = useRef<any[]>([]);
  const accessToken = import.meta.env.VITE_GALLI_API_KEY as string | undefined;

  const loadScript = () => new Promise<void>((resolve, reject) => {
    const src = 'https://gallimap.com/static/dist/js/gallimaps.vector.min.latest.js';
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).GalliMapPlugin) return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load GalliMaps plugin script')));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load GalliMaps plugin script'));
    document.body.appendChild(s);
  });

  useEffect(() => {
    (async () => {
      if (!containerRef.current) return;
      await loadScript();
      const GalliMapPlugin = (window as any).GalliMapPlugin;
      if (!GalliMapPlugin) return;

      const options = {
        accessToken: accessToken || '',
        map: {
          container: containerIdRef.current,
          center: [center.lat, center.lng],
          zoom: 12,
          maxZoom: 25,
          minZoom: 5,
          clickable: false,
        },
        pano: { container: panoIdRef.current },
      } as any;

      const map = new GalliMapPlugin(options);
      mapRef.current = map;

      renderMarkers();
      renderUserMarker();
      renderRoute();
    })();

    return () => {
      try {
        const map = mapRef.current;
        if (map) {
          pickupMarkersRef.current.forEach(m => map.removePinMarker?.(m));
          destinationMarkersRef.current.forEach(m => map.removePinMarker?.(m));
          pickupMarkersRef.current = [];
          destinationMarkersRef.current = [];
          if (userMarkerRef.current) {
            map.removePinMarker?.(userMarkerRef.current);
            userMarkerRef.current = null;
          }
          drawnRouteNamesRef.current.forEach(name => map.removePolygon?.(name));
          drawnRouteNamesRef.current = [];
        }
      } catch {}
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    try {
      if (map && typeof map.setCenter === 'function') {
        map.setCenter([center.lat, center.lng]);
      }
    } catch {}
  }, [center.lat, center.lng]);

  useEffect(() => {
    renderUserMarker();
    if (followUser && userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      try {
        mapRef.current?.setCenter?.([userLocation.lat, userLocation.lng]);
      } catch {}
    }
  }, [userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    renderMarkers();
  }, [deliveries]);

  useEffect(() => {
    renderRoute();
  }, [routeGeoJson, routeSegments]);

  function clearMarkers() {
    const map = mapRef.current;
    if (!map) return;
    pickupMarkersRef.current.forEach(m => map.removePinMarker?.(m));
    destinationMarkersRef.current.forEach(m => map.removePinMarker?.(m));
    pickupMarkersRef.current = [];
    destinationMarkersRef.current = [];
  }

  function renderMarkers() {
    const map = mapRef.current;
    if (!map) return;
    clearMarkers();

    deliveries.forEach(d => {
      const plat = d.pickup_latitude ? parseFloat(String(d.pickup_latitude)) : undefined;
      const plng = d.pickup_longitude ? parseFloat(String(d.pickup_longitude)) : undefined;
      if (typeof plat === 'number' && typeof plng === 'number' && !isNaN(plat) && !isNaN(plng)) {
        // Pickup marker: blue
        const pinMarkerObject = { color: '#3b82f6', draggable: false, latLng: [plat, plng] } as any;
        try {
          const marker = map.displayPinMarker?.(pinMarkerObject);
          if (marker) pickupMarkersRef.current.push(marker);
        } catch {}
      }

      const dlat = d.delivery_latitude ? parseFloat(String(d.delivery_latitude)) : undefined;
      const dlng = d.delivery_longitude ? parseFloat(String(d.delivery_longitude)) : undefined;
      if (typeof dlat === 'number' && typeof dlng === 'number' && !isNaN(dlat) && !isNaN(dlng)) {
        // Delivery marker: red
        const pinMarkerObject = { color: '#ef4444', draggable: false, latLng: [dlat, dlng] } as any;
        try {
          const marker = map.displayPinMarker?.(pinMarkerObject);
          if (marker) destinationMarkersRef.current.push(marker);
        } catch {}
      }
    });
  }

  function renderUserMarker() {
    const map = mapRef.current;
    if (!map) return;
    const hasUser = userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number';
    try {
      if (hasUser) {
        if (userMarkerRef.current) {
          map.removePinMarker?.(userMarkerRef.current);
          userMarkerRef.current = null;
        }
        const pinMarkerObject = { color: '#22c55e', draggable: false, latLng: [userLocation!.lat, userLocation!.lng] } as any;
        userMarkerRef.current = map.displayPinMarker?.(pinMarkerObject) || null;
      } else if (userMarkerRef.current) {
        map.removePinMarker?.(userMarkerRef.current);
        userMarkerRef.current = null;
      }
    } catch {}
  }

  function renderRoute() {
    const map = mapRef.current;
    if (!map) return;
    try {
      drawnRouteNamesRef.current.forEach(name => map.removePolygon?.(name));
      drawnRouteNamesRef.current = [];
      try { segLabelMarkersRef.current.forEach(m => map.removePinMarker?.(m)); } catch {}
      segLabelMarkersRef.current = [];

      const batches: Array<{ fc: GeoJSON.FeatureCollection; color: string; baseName: string }>= [];
      if (routeSegments && routeSegments.length) {
        routeSegments.forEach((seg, i) => {
          if (seg?.geojson?.features?.length) {
            batches.push({ fc: seg.geojson, color: seg.color || (i === 0 ? '#22c55e' : '#ff6b00'), baseName: seg.name || `route-seg-${i}` });
          }
        });
      } else if (routeGeoJson && routeGeoJson.features?.length) {
        batches.push({ fc: routeGeoJson, color: '#ff6b00', baseName: 'route' });
      } else {
        return;
      }

      let idx = 0;
      const allCoords: [number, number][] = [];
      for (const batch of batches) {
        const batchCoords: [number, number][] = [];
        for (const f of batch.fc.features as any[]) {
          const g = f?.geometry;
          if (!g) continue;
          if (g.type === 'LineString' || g.type === 'MultiLineString') {
            const name = `${batch.baseName}-${idx++}`;
            const geoJson = g.type === 'LineString' ? { type: 'Feature', geometry: g } : {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: (g.coordinates as [number, number][][]).flat(),
              }
            };
            const coords = (geoJson as any).geometry.coordinates as [number, number][];
            if (Array.isArray(coords)) { allCoords.push(...coords); batchCoords.push(...coords); }
            const lineStringOption = {
              name,
              color: batch.color,
              opacity: 0.9,
              width: 5,
              latLng: [center.lat, center.lng],
              geoJson,
            } as any;
            map.drawPolygon?.(lineStringOption);
            drawnRouteNamesRef.current.push(name);
          }
        }
        if (batchCoords.length) {
          const midIdx = Math.floor(batchCoords.length / 2);
          const [mlng, mlat] = batchCoords[midIdx];
          try {
            const marker = map.displayPinMarker?.({ color: batch.color, draggable: false, latLng: [mlat, mlng], title: batch.baseName } as any);
            if (marker) segLabelMarkersRef.current.push(marker);
          } catch {}
        }
      }

      if (allCoords.length) {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        for (const [lng, lat] of allCoords) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
        const midLng = (minLng + maxLng) / 2;
        const midLat = (minLat + maxLat) / 2;
        const spanLng = Math.max(0.0001, maxLng - minLng);
        const spanLat = Math.max(0.0001, maxLat - minLat);
        const maxSpan = Math.max(spanLng, spanLat);
        let zoom = 14;
        if (maxSpan > 0.3) zoom = 11; else if (maxSpan > 0.15) zoom = 12; else if (maxSpan > 0.07) zoom = 13; else zoom = 14;
        try {
          if (typeof map.setCenter === 'function') map.setCenter([midLat, midLng]);
          if (typeof map.setZoom === 'function') map.setZoom(zoom);
        } catch {}
      }
    } catch {}
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} id={containerIdRef.current} style={{ width: '100%', height: '100%' }} />
      <div id={panoIdRef.current} style={{ display: 'none', width: 0, height: 0 }} />

      {routeSegments && routeSegments.length > 0 && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Route Legend</div>
            {routeSegments.map((seg, i) => (
              <div key={i} title={seg.name || `Segment ${i + 1}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 4 }}>
                <span style={{ width: 12, height: 12, background: seg.color || (i === 0 ? '#22c55e' : '#ff6b00'), borderRadius: 2, display: 'inline-block', border: '1px solid #e5e7eb' }} />
                <span>{seg.name || `Segment ${i + 1}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GalliMap;
