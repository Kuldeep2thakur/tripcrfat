'use client';

import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLng } from 'leaflet';
import { getLocationName } from '@/lib/geocoding';

interface MapComponentProps {
  onLocationSelect: (location: { name: string; coordinates: { lat: number; lng: number } }) => void;
  defaultLocation?: { name: string; coordinates: { lat: number; lng: number } };
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (latLng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

export default function DynamicMap({ onLocationSelect, defaultLocation }: MapComponentProps) {
  const [marker, setMarker] = useState(defaultLocation?.coordinates);
  
  const handleMapClick = useCallback(async (latLng: LatLng) => {
    const name = await getLocationName(latLng.lat, latLng.lng);
    setMarker({ lat: latLng.lat, lng: latLng.lng });
    onLocationSelect({
      name,
      coordinates: { lat: latLng.lat, lng: latLng.lng }
    });
  }, [onLocationSelect]);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={defaultLocation?.coordinates || { lat: 20, lng: 0 }}
        zoom={defaultLocation ? 13 : 2}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onLocationSelect={handleMapClick} />
        {marker && (
          <Marker position={[marker.lat, marker.lng]} />
        )}
      </MapContainer>
    </div>
  );
}