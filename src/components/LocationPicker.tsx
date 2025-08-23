import 'leaflet/dist/leaflet.css'
import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

interface LocationPickerProps {
  initialCenter: { lat: number; lng: number }
  zoom?: number
  onSelect: (lat: number, lng: number) => void
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialCenter,
  zoom = 13,
  onSelect,
}) => {
  const [position, setPosition] = useState<LatLngExpression | null>(null)

  const MapClickHandler = () => {
    const map = useMap()
    map.on('click', (e) => {
      setPosition(e.latlng)
      onSelect(e.latlng.lat, e.latlng.lng)
    })
    return null
  }

  return (
    <MapContainer
      center={[initialCenter.lat, initialCenter.lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler />
      {position && <Marker position={position} />}
    </MapContainer>
  )
}

export default LocationPicker
