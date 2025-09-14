import React, { useEffect, useRef, useState } from 'react'

interface LocationPickerProps {
  initialCenter: { lat: number; lng: number }
  zoom?: number
  onSelect: (lat: number, lng: number) => void
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialCenter, zoom = 13, onSelect }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any | null>(null)
  const markerRef = useRef<any | null>(null)
  const containerIdRef = useRef<string>(`galli-map-${Math.random().toString(36).slice(2)}`)
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
      if (!mapContainerRef.current) return
      if (!accessToken) {
        setError('Galli access token is missing. Please set VITE_GALLI_API_KEY.')
        return
      }
      await loadScript()
      const GalliMapPlugin = (window as any).GalliMapPlugin
      if (!GalliMapPlugin) return

      const customClick = (event: any) => {
        const lng = event?.lngLat?.lng
        const lat = event?.lngLat?.lat
        if (typeof lat === 'number' && typeof lng === 'number') {
          // Drop or move pin marker using plugin API
          try {
            if (markerRef.current && mapInstanceRef.current?.removePinMarker) {
              mapInstanceRef.current.removePinMarker(markerRef.current)
              markerRef.current = null
            }
            const pinMarkerObject = {
              color: '#f97316',
              draggable: false,
              latLng: [lat, lng],
            }
            if (mapInstanceRef.current?.displayPinMarker) {
              markerRef.current = mapInstanceRef.current.displayPinMarker(pinMarkerObject)
            }
          } catch {}
          onSelect(lat, lng)
        }
      }

      const options = {
        accessToken: accessToken || '',
        map: {
          container: containerIdRef.current,
          center: [initialCenter.lat, initialCenter.lng],
          zoom: Math.max(5, Math.min(25, zoom)),
          maxZoom: 25,
          minZoom: 5,
          clickable: true,
        },
        customClickFunctions: [customClick],
      }

      const map = new GalliMapPlugin(options)
      mapInstanceRef.current = map
      setPluginReady(true)
    })()

    return () => {
      try {
        if (markerRef.current && mapInstanceRef.current?.removePinMarker) {
          mapInstanceRef.current.removePinMarker(markerRef.current)
        }
      } catch {}
      markerRef.current = null
      mapInstanceRef.current = null
    }
  }, [])

  // Autocomplete: debounce query and fetch suggestions
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !pluginReady) return
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      setError(null)
      return
    }
    setLoading(true)
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await map.autoCompleteSearch?.(query)
        setSuggestions(Array.isArray(res) ? res : [])
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch suggestions')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [query, pluginReady])

  const handleSelectSuggestion = async (item: any) => {
    const map = mapInstanceRef.current
    if (!map) return
    try {
      if (typeof map.searchData === 'function') {
        try {
          await map.searchData(item)
        } catch {
          const name: string = item?.name || item?.address || item?.display_name || ''
          if (name) await map.searchData(name)
        }
      }
      const rawLat = item?.lat ?? item?.latitude
      const rawLng = item?.lng ?? item?.longitude
      const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat
      const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng
      if (typeof lat === 'number' && typeof lng === 'number') {
        if (typeof map.setCenter === 'function') {
          map.setCenter([lat, lng])
        }
        try {
          if (markerRef.current && mapInstanceRef.current?.removePinMarker) {
            mapInstanceRef.current.removePinMarker(markerRef.current)
            markerRef.current = null
          }
          const pinMarkerObject = {
            color: '#f97316',
            draggable: false,
            latLng: [lat, lng],
          }
          if (mapInstanceRef.current?.displayPinMarker) {
            markerRef.current = mapInstanceRef.current.displayPinMarker(pinMarkerObject)
          }
        } catch {}
        onSelect(lat, lng)
      }
    } catch (e) {}
    setQuery('')
    setSuggestions([])
  }

  useEffect(() => {
    const map = mapInstanceRef.current
    try {
      if (map && typeof map.setCenter === 'function') {
        map.setCenter([initialCenter.lat, initialCenter.lng])
      }
      if (map && typeof map.setZoom === 'function') {
        map.setZoom(Math.max(5, Math.min(25, zoom)))
      }
    } catch {}
  }, [initialCenter.lat, initialCenter.lng, zoom])

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
      <div id={containerIdRef.current} ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}

export default LocationPicker
