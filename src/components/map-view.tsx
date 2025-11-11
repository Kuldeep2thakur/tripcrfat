'use client';

import { MapPicker } from './map-picker';
import { ClientOnly } from './client-only';

interface MapViewProps {
  location: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export function MapView({ location }: MapViewProps) {
  const center: [number, number] = [location.coordinates.lat, location.coordinates.lng];

  return (
    <ClientOnly>
      <div className="h-[200px] w-full rounded-lg overflow-hidden">
        <MapPicker 
          center={center} 
          onLocationSelected={() => {}} // No-op since this is view-only
        />
      </div>
    </ClientOnly>
  );
}