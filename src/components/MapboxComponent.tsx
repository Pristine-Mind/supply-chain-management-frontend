import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoidG9nZ2xlY29ycCIsImEiOiJjazk5ZXMza2YxZmQ1M2dvNWxneTEycnQwIn0.K3u-ns63rFzM7CzrnOBm2w';

interface MapboxComponentProps {
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
}

const MapboxComponent: React.FC<MapboxComponentProps> = ({ onLocationSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    initializeMap();

    return () => cleanUpMap();
  }, [onLocationSelect]);

  const initializeMap = () => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [85.324, 27.7172],
        zoom: 8,
      });

      map.on('click', handleMapClick);
      mapInstanceRef.current = map;
    }
  };

  const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
    const { lngLat } = event;
    const location = { latitude: lngLat.lat, longitude: lngLat.lng };

    setSelectedPosition(location);
    onLocationSelect(location);

    updateMarker(lngLat);
  };

  const updateMarker = (lngLat: mapboxgl.LngLat) => {
    if (markerRef.current) {
      markerRef.current.remove();
    }

    markerRef.current = new mapboxgl.Marker({ color: 'red', rotation: 45 })
      .setLngLat([lngLat.lng, lngLat.lat])
      .addTo(mapInstanceRef.current!);
  };

  const cleanUpMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  };

  return (
    <div>
      <div ref={mapContainerRef} style={{ width: '100%', height: '400px' }} />
      {selectedPosition && (
        <SelectedLocationDisplay selectedPosition={selectedPosition} />
      )}
    </div>
  );
};

interface SelectedLocationDisplayProps {
  selectedPosition: { latitude: number; longitude: number };
}

const SelectedLocationDisplay: React.FC<SelectedLocationDisplayProps> = ({ selectedPosition }) => (
  <div>
    <h3>Selected Location:</h3>
    <p>Latitude: {selectedPosition.latitude}</p>
    <p>Longitude: {selectedPosition.longitude}</p>
  </div>
);

export default MapboxComponent;
