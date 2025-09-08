import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, LngLatLike, GeoJSONSource, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
}

const priorityColor = (priority?: string | null) => {
  const p = (priority || 'normal').toLowerCase();
  switch (p) {
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#10b981';
    default: return '#3b82f6';
  }
};

const GeoapifyMap: React.FC<Props> = ({ apiKey, center, deliveries, userLocation, routeGeoJson }) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef<boolean>(false);
  const pickupMarkersRef = useRef<MapLibreMarker[]>([]);
  const destinationMarkersRef = useRef<MapLibreMarker[]>([]);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);

  // init map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${apiKey}`,
      center: [center.lng, center.lat] as LngLatLike,
      zoom: 12,
      attributionControl: true
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }));

    map.on('load', () => {
      loadedRef.current = true;
      // route source/layer
      map.addSource('route', {
        type: 'geojson',
        data: routeGeoJson || {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#ff6b00',
          'line-width': 5,
          'line-opacity': 0.9
        }
      });
      // initial render of markers
      renderMarkers();
      renderUserMarker();
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      loadedRef.current = false;
      clearMarkers();
      userMarkerRef.current = null;
    };
  }, [apiKey]);

  // center updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setCenter([center.lng, center.lat]);
  }, [center.lat, center.lng]);

  // user marker updates
  useEffect(() => {
    renderUserMarker();
  }, [userLocation?.lat, userLocation?.lng]);

  // deliveries updates
  useEffect(() => {
    renderMarkers();
  }, [deliveries]);

  // update route layer data
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const src = map.getSource('route') as GeoJSONSource | undefined;
    if (src) {
      src.setData(routeGeoJson || { type: 'FeatureCollection', features: [] });
    }
  }, [routeGeoJson]);

  function clearMarkers() {
    pickupMarkersRef.current.forEach(m => m.remove());
    destinationMarkersRef.current.forEach(m => m.remove());
    pickupMarkersRef.current = [];
    destinationMarkersRef.current = [];
  }

  function renderMarkers() {
    const map = mapInstanceRef.current;
    if (!map || !loadedRef.current) return;
    clearMarkers();

    // pickups
    deliveries.forEach(d => {
      const plat = d.pickup_latitude ? parseFloat(String(d.pickup_latitude)) : undefined;
      const plng = d.pickup_longitude ? parseFloat(String(d.pickup_longitude)) : undefined;
      if (typeof plat === 'number' && typeof plng === 'number' && !isNaN(plat) && !isNaN(plng)) {
        const pel = document.createElement('div');
        const color = priorityColor(d.priority);
        pel.style.cssText = `background:${color};border-radius:50%;width:18px;height:18px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)`;
        const marker = new maplibregl.Marker({ element: pel })
          .setLngLat([plng, plat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(
            `<div style="font-size:12px">
              <div><b>#${d.tracking_number || d.id}</b></div>
              <div><b>Pickup:</b> ${d.pickup_address || ''}</div>
            </div>`
          ))
          .addTo(map);
        pickupMarkersRef.current.push(marker);
      }

      const dlat = d.delivery_latitude ? parseFloat(String(d.delivery_latitude)) : undefined;
      const dlng = d.delivery_longitude ? parseFloat(String(d.delivery_longitude)) : undefined;
      if (typeof dlat === 'number' && typeof dlng === 'number' && !isNaN(dlat) && !isNaN(dlng)) {
        const del = document.createElement('div');
        del.style.cssText = 'background:#10b981;border-radius:50%;width:16px;height:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)';
        const marker = new maplibregl.Marker({ element: del })
          .setLngLat([dlng, dlat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(
            `<div style="font-size:12px">
              <div><b>#${d.tracking_number || d.id}</b></div>
              <div><b>Delivery:</b> ${d.delivery_address || ''}</div>
              ${d.delivery_fee ? `<div><b>Fee:</b> ${d.delivery_fee}</div>` : ''}
            </div>`
          ))
          .addTo(map);
        destinationMarkersRef.current.push(marker);
      }
    });
  }

  function renderUserMarker() {
    const map = mapInstanceRef.current;
    if (!map || !loadedRef.current) return;
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      const el = document.createElement('div');
      el.style.cssText = 'background:#3b82f6;border-radius:50%;width:16px;height:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)';
      if (!userMarkerRef.current) {
        userMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([userLocation.lng, userLocation.lat])
          .setPopup(new maplibregl.Popup().setHTML('<b>Your location</b>'))
          .addTo(map);
      } else {
        userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default GeoapifyMap;
