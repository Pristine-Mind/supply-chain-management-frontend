import React, { useEffect, useRef } from 'react'
import maplibregl, { Map as MapLibreMap, Marker as MapLibreMarker, LngLatLike } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface LocationPickerProps {
  initialCenter: { lat: number; lng: number }
  zoom?: number
  onSelect: (lat: number, lng: number) => void
}

const LocationPicker: React.FC<LocationPickerProps> = ({ initialCenter, zoom = 13, onSelect }) => {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<MapLibreMarker | null>(null)
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY as string | undefined

  useEffect(() => {
    if (!mapRef.current) return

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${apiKey || ''}`,
      center: [initialCenter.lng, initialCenter.lat] as LngLatLike,
      zoom,
    })

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }))
    map.addControl(new maplibregl.AttributionControl({ compact: true }))

    const handleClick = (e: any) => {
      const { lng, lat } = e.lngLat
      if (!markerRef.current) {
        const el = document.createElement('div')
        el.style.cssText = 'background:#f97316;border-radius:50%;width:18px;height:18px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)'
        markerRef.current = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map)
      } else {
        markerRef.current.setLngLat([lng, lat])
      }
      onSelect(lat, lng)
    }

    map.on('click', handleClick)

    mapInstanceRef.current = map

    return () => {
      map.off('click', handleClick)
      map.remove()
      mapInstanceRef.current = null
      markerRef.current = null
    }
  }, [apiKey])

  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return
    map.setCenter([initialCenter.lng, initialCenter.lat])
    map.setZoom(zoom)
  }, [initialCenter.lat, initialCenter.lng, zoom])

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
}

export default LocationPicker
