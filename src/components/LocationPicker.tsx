import React, { useEffect, useRef, useState } from 'react'

interface LocationPickerProps {
  initialCenter: { lat: number; lng: number }
  zoom?: number
  onSelect: (lat: number, lng: number) => void
  showMarker?: boolean
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialCenter, zoom = 13, onSelect, showMarker = false }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const containerIdRef = useRef<string>(`galli-map-${Math.random().toString(36).slice(2)}`)
  const panoIdRef = useRef<string>(`galli-pano-${Math.random().toString(36).slice(2)}`)
  const accessToken = import.meta.env.VITE_GALLI_API_KEY as string | undefined
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(!accessToken ? 'Galli access token is missing. Please set VITE_GALLI_API_KEY.' : null)
  const [pluginReady, setPluginReady] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const loadScript = () => new Promise<void>((resolve, reject) => {
    const src = 'https://gallimap.com/static/dist/js/gallimaps.vector.min.latest.js'
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      if ((window as any).GalliMapPlugin) return resolve()
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load GalliMaps plugin script')))
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load GalliMaps plugin script'))
    document.body.appendChild(s)
  })

  useEffect(() => {
    (async () => {
      if (!mapContainerRef.current) return;
      
      try {
        await loadScript();
        const GalliMapPlugin = (window as any).GalliMapPlugin;
        if (!GalliMapPlugin) return;

        // GalliMaps Options (based on documentation example)
        const galliMapsObject = {
          accessToken: accessToken || '',
          map: { 
            container: containerIdRef.current, 
            center: [initialCenter.lat, initialCenter.lng], 
            zoom: Math.max(5, Math.min(25, zoom)), 
            maxZoom: 25, 
            minZoom: 5,
            clickable: true
          },
          pano: { container: panoIdRef.current }
        };

        // Initialize Gallimaps Object
        const map = new GalliMapPlugin(galliMapsObject);
        mapInstanceRef.current = map;
        setPluginReady(true);

        // Add click handler for interactive marker placement
        if (map && typeof map.on === 'function') {
          map.on('click', (event: any) => {
            const lat = event?.lngLat?.lat;
            const lng = event?.lngLat?.lng;
            if (typeof lat === 'number' && typeof lng === 'number') {
              // Remove existing marker
              if (markerRef.current && map.removePinMarker) {
                map.removePinMarker(markerRef.current);
                markerRef.current = null;
              }
              
              // Initialize marker object (based on documentation)
              const pinMarkerObject = {
                color: "#f97316", // Orange hex color
                draggable: false,
                latLng: [lat, lng]
              };

              // Display a pin marker on the map
              const marker = map.displayPinMarker(pinMarkerObject);
              if (marker) {
                markerRef.current = marker;
              }
              
              onSelect(lat, lng);
            }
          });
        }

        // Place initial marker if showMarker is true
        if (showMarker) {
          setTimeout(() => {
            renderInitialMarker();
          }, 100);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to initialize map');
      }
    })();

    return () => {
      try {
        if (markerRef.current && mapInstanceRef.current?.removePinMarker) {
          mapInstanceRef.current.removePinMarker(markerRef.current);
        }
      } catch {}
      markerRef.current = null;
      mapInstanceRef.current = null;
    };
  }, []);

  function renderInitialMarker() {
    const map = mapInstanceRef.current;
    if (!map || !showMarker) return;
    
    try {
      // Remove existing marker
      if (markerRef.current && map.removePinMarker) {
        map.removePinMarker(markerRef.current);
        markerRef.current = null;
      }
      
      // Initialize marker object (based on documentation)
      const pinMarkerObject = {
        color: "#f97316", // Orange hex color
        draggable: false,
        latLng: [initialCenter.lat, initialCenter.lng]
      };

      // Display a pin marker on the map
      const marker = map.displayPinMarker(pinMarkerObject);
      if (marker) {
        markerRef.current = marker;
      }
    } catch (error) {
      console.error('Error placing initial marker:', error);
    }
  }

  // Effect to update marker when coordinates change
  useEffect(() => {
    if (pluginReady && mapInstanceRef.current) {
      setTimeout(() => {
        renderInitialMarker();
      }, 50);
    }
  }, [showMarker, pluginReady, initialCenter.lat, initialCenter.lng]);

  // Autocomplete search functionality
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !pluginReady) return;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setError(null);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await map.autoCompleteSearch?.(query);
        setSuggestions(Array.isArray(res) ? res : []);
        setError(null);
      } catch (e) {
        setError('Search failed');
        setSuggestions([]);
      }
      setLoading(false);
    }, 300);
  }, [query, pluginReady]);

  const handleSelectSuggestion = async (s: any) => {
    try {
      if (s?.geometry?.coordinates && Array.isArray(s.geometry.coordinates) && s.geometry.coordinates.length >= 2) {
        const lng = s.geometry.coordinates[0];
        const lat = s.geometry.coordinates[1];
        
        if (typeof lat === 'number' && typeof lng === 'number') {
          const map = mapInstanceRef.current;
          if (map) {
            // Remove existing marker
            if (markerRef.current && map.removePinMarker) {
              map.removePinMarker(markerRef.current);
              markerRef.current = null;
            }
            
            // Initialize marker object
            const pinMarkerObject = {
              color: "#f97316",
              draggable: false,
              latLng: [lat, lng]
            };

            // Display a pin marker on the map
            const marker = map.displayPinMarker(pinMarkerObject);
            if (marker) {
              markerRef.current = marker;
            }
          }
          onSelect(lat, lng);
        }
      }
    } catch (e) {
      console.warn('Error handling suggestion:', e);
    }
    setQuery('');
    setSuggestions([]);
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    try {
      if (map && typeof map.setCenter === 'function') {
        map.setCenter([initialCenter.lat, initialCenter.lng]);
      }
      if (map && typeof map.setZoom === 'function') {
        map.setZoom(Math.max(5, Math.min(25, zoom)));
      }
    } catch {}
  }, [initialCenter.lat, initialCenter.lng, zoom]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Search box */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10 }}>
        <div className="bg-white shadow rounded-md border border-gray-200">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places..."
            className="w-full px-3 py-2 text-sm outline-none rounded-md"
          />
          {loading && (
            <div className="px-3 py-2 text-xs text-gray-500">Searching…</div>
          )}
          {error && (
            <div className="px-3 py-2 text-xs text-red-600">{error}</div>
          )}
          {suggestions.length > 0 && (
            <div className="max-h-60 overflow-auto">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s?.name || s?.address || s?.display_name || 'Result'}
                </button>
              ))}
            </div>
          )}
        </div>
        {!pluginReady && !error && (
          <div className="mt-2 text-xs text-gray-600">Initializing Galli map…</div>
        )}
      </div>
      
      {/* Map container */}
      <div id={containerIdRef.current} ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
      
      {/* Hidden pano container (required by GalliMaps) */}
      <div id={panoIdRef.current} style={{ display: 'none' }} />
    </div>
  );
};

export default LocationPicker;
